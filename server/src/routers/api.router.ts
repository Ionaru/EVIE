import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { User } from '../models/user.model';
import { generateUniquePID } from '../services/pid.service';
import { BaseRouter, sendResponse } from './base.router';

export class APIRouter extends BaseRouter {

    // TODO: Route for resetting a password

    /**
     * Request that will return the user session, this is used when the client first loads.
     * path: /api/handshake
     * method: GET
     * returns:
     *  200 LoggedIn: The client has an active session
     *  200 NotLoggedIn: No client session was found
     */
    private static async doHandShake(request: Request, response: Response): Promise<void> {

        if (!request.session!.user.id) {
            // No user ID present in the session.
            return sendResponse(response, httpStatus.OK, 'NotLoggedIn');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.email', 'user.pid', 'user.username', 'user.timesLogin', 'user.lastLogin'])
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        if (!user) {
            // No user found that matches the ID in the session.
            return sendResponse(response, httpStatus.OK, 'NotLoggedIn');
        }

        user.timesLogin++;
        user.lastLogin = new Date();
        user.save().then();
        const userData = {
            characters: user.characters.map((character) => character.getSanitizedCopy()),
            email: user.email,
            pid: user.pid,
            username: user.username,
        };
        return sendResponse(response, httpStatus.OK, 'LoggedIn', userData);
    }

    /**
     * Check a User's username/email and password, then add the User id to the current session.
     * path: /api/login
     * method: POST
     * params:
     *  username: The username or email of the registered user
     *  password: The password matching the registered user
     * returns:
     *  200 LoggedIn: When the login was successful
     *  404 IncorrectLogin: When the username was not found
     *  401 IncorrectLogin: When the password did not match the found username
     */
    private static async loginUser(request: Request, response: Response): Promise<void> {
        // Extract the username/email and password from the request
        const username = request.body.username;
        const password = request.body.password;

        if (!username || !password) {
            // Missing parameters
            return sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        const user: User | undefined = await User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.username = :username', {username})
            .orWhere('user.email = :username', {username})
            .getOne();

        if (!user) {
            // No user with that username was found
            return sendResponse(response, httpStatus.NOT_FOUND, 'IncorrectLogin');
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) {
            // Password did not match the passwordHash
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'IncorrectLogin');
        }

        request.session!.user.id = user.id;
        request.session!.user.pid = user.pid;
        user.timesLogin++;
        user.lastLogin = new Date();
        await user.save();
        logger.info(user.username + ' logged in.');
        const userData = {
            characters: user.characters.map((character) => character.getSanitizedCopy()),
            email: user.email,
            pid: user.pid,
            username: user.username,
        };
        return sendResponse(response, httpStatus.OK, 'LoggedIn', userData);
    }

    /**
     * Destroy the user session and redirect them back to the homepage.
     * path: /api/logout
     * method: POST
     */
    private static async logoutUser(request: Request, response: Response): Promise<void> {
        request.session!.destroy(() => {
            response.end();
        });
    }

    /**
     * Register a new user using a username, email and password.
     * path: /api/register
     * method: POST
     * params:
     *  username: The username the user wants to register with
     *  email: The email the user wants to register with
     *  password: The password this user wants to access their account with
     * returns:
     *  200 Registered: When the user was successfully created
     *  409 Taken: When the username or email is already in use
     */
    private static async registerUser(request: Request, response: Response): Promise<void> {
        // Extract the form data from the request and trim the whitespace from the username and email.
        const username: string = request.body.username.trim();
        const email: string = request.body.email.trim();
        const password: string = request.body.password;

        if (!username || !email || !password) {
            // Missing parameters
            return sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        const user: User | undefined = await User.doQuery()
            .where('user.username = :username', {username})
            .orWhere('user.username = :email', {email})
            .orWhere('user.email = :username', {username})
            .orWhere('user.email = :email', {email})
            .getOne();

        if (user) {
            // The regular expression checks if the username or email matched the one from the user in the database
            // this is done to return an accurate error message.
            const existingUsername = new RegExp('^' + user.username + '$', 'i');
            const existingEmail = new RegExp('^' + user.email + '$', 'i');
            let usernameInUse = false;
            let emailInUse = false;
            if (username.match(existingUsername) || username.match(existingEmail)) {
                usernameInUse = true;
            }
            if (email.match(existingEmail) || email.match(existingUsername)) {
                emailInUse = true;
            }

            return sendResponse(response, httpStatus.CONFLICT, 'Taken', {
                email_in_use: emailInUse,
                username_in_use: usernameInUse,
            });
        }

        const newUser = new User();
        newUser.email = email;
        newUser.passwordHash = bcrypt.hashSync(password);
        newUser.pid = await generateUniquePID(8, User);
        newUser.username = username;
        await newUser.save();

        return sendResponse(response, httpStatus.OK, 'Registered', {
            email: newUser.email,
            pid: newUser.pid,
            username: newUser.username,
        });
    }

    /**
     * Change a password of a user
     * path: /api/change/password
     * method: POST
     * params:
     *  pid: The pid of the user
     *  oldPassword: The current password of the user
     *  newPassword: The new password
     * returns:
     *  200 PasswordChanged: The password was changed successfully
     *  403 WrongPassword: The oldPassword parameter did not match the user's current password
     *  401 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The PID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
    private static async changeUserPassword(request: Request, response: Response): Promise<void> {

        if (!request.session!.user.id) {
            // User is not logged in and isn't allowed to change an email
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
        }

        const pid = request.body.pid;
        const oldPassword = request.body.oldpassword;
        const newPassword = request.body.newpassword;

        if (!pid || !oldPassword || !newPassword) { // TODO: Administrator override
            // Missing parameters
            return sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        if (pid !== request.session!.user.pid) { // TODO: Administrator override
            // The user from the session does not match the user it is trying to modify, regular users cannot delete
            // a user that is not their own.
            return sendResponse(response, httpStatus.FORBIDDEN, 'NotYourUser');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.pid', 'user.passwordHash'])
            .where('user.pid = :pid', {pid})
            .getOne();

        if (!user) { // TODO: Administrator override
            // The user PID was not found in the database
            return sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        if (!bcrypt.compareSync(oldPassword, user.passwordHash)) { // TODO: Administrator override
            // The password did not match the password of the user we want to modify.
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'WrongPassword');
        }

        user.passwordHash = bcrypt.hashSync(newPassword, 8);
        await user.save();
        return sendResponse(response, 200, 'PasswordChanged');
    }

    /**
     * Change the email address of a user
     * path: /api/change/email
     * method: POST
     * params:
     *  pid: The pid of the user
     *  password: The current password of the user
     *  newEmail: The new email address
     * returns:
     *  200 EmailChanged: The email was changed successfully
     *  409 EmailInUse: The email address is already in use by someone else
     *  401 WrongPassword: The password parameter did not match the user's current password
     *  403 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The PID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
    private static async changeUserEmail(request: Request, response: Response): Promise<void> {

        if (!request.session!.user.id) {
            // User is not logged in and isn't allowed to change an email
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
        }

        const pid = request.body.pid;
        const password = request.body.password;
        const newEmail = request.body.newemail;

        if (!pid || !password || !newEmail) { // TODO: Administrator override
            // Missing parameters
            return sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        if (pid !== request.session!.user.pid) { // TODO: Administrator override
            // The user from the session does not match the user it is trying to modify, regular users cannot delete
            // a user that is not their own.
            return sendResponse(response, httpStatus.FORBIDDEN, 'NotYourUser');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.pid', 'user.passwordHash'])
            .where('user.pid = :pid', {pid})
            .getOne();

        if (!user) { // TODO: Administrator override
            // The user PID was not found in the database
            return sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
            // The password did not match the password of the user we want to modify.
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'WrongPassword');
        }

        const existingUser: User | undefined = await User.doQuery()
            .select(['user.id', 'user.pid', 'user.passwordHash'])
            .where('user.username = :newEmail', {newEmail})
            .orWhere('user.email = :newEmail', {newEmail})
            .getOne();

        if (existingUser) {
            // The email provided was already in use
            return sendResponse(response, httpStatus.CONFLICT, 'EmailInUse');
        }

        // The new email is unique
        user.email = newEmail;
        await user.save();
        return sendResponse(response, httpStatus.OK, 'EmailChanged');
    }

    /**
     * Change the username of a user
     * path: /api/change/username
     * method: POST
     * params:
     *  pid: The pid of the user
     *  password: The current password of the user
     *  newUsername: The new username
     * returns:
     *  200 UsernameChanged: The username was changed successfully
     *  409 UsernameInUse: The username is already in use by someone else
     *  401 WrongPassword: The password parameter did not match the user's current password
     *  403 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The PID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
    private static async changeUserUsername(request: Request, response: Response): Promise<void> {

        if (!request.session!.user.id) {
            // User is not logged in and isn't allowed to change a username
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
        }
        const pid = request.body.pid;
        const password = request.body.password;
        const newUsername = request.body.newusername;

        if (!pid || !password || !newUsername) { // TODO: Administrator override
            // Missing parameters
            return sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        if (pid !== request.session!.user.pid) { // TODO: Administrator override
            // The user from the session does not match the user it is trying to modify, regular users cannot delete
            // a user that is not their own.
            return sendResponse(response, httpStatus.FORBIDDEN, 'NotYourUser');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.pid', 'user.passwordHash'])
            .where('user.pid = :pid', {pid})
            .getOne();

        if (!user) {
            // The user PID was not found in the database
            return sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
            // The password did not match the password of the user we want to modify.
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'WrongPassword');
        }

        const existingUser: User | undefined = await User.doQuery()
            .select(['user.id', 'user.pid', 'user.passwordHash'])
            .where('user.username = :newUsername', {newUsername})
            .orWhere('user.email = :newUsername', {newUsername})
            .getOne();

        if (existingUser) {
            // The username provided was already in use
            return sendResponse(response, httpStatus.CONFLICT, 'UsernameInUse');
        }

        user.username = newUsername;
        await user.save();
        return sendResponse(response, httpStatus.OK, 'UsernameChanged');
    }

    /**
     * Delete a user
     * path: /api/delete
     * method: POST
     * params:
     *  pid: The pid of the user to delete
     *  password: The password of the user to delete, for verification
     * returns:
     *  200 UserDeleted: The user was deleted successfully
     *  401 WrongPassword: The oldPassword parameter did not match the user's current password
     *  403 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The PID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
    private static async deleteUser(request: Request, response: Response): Promise<void> {

        if (!request.session!.user.id) {
            // No user ID present in the session.
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
        }

        const pid = request.body.pid;
        const password = request.body.password;

        if (!pid || !password) { // TODO: Administrator override
            // Missing parameters
            return sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        if (pid !== request.session!.user.pid) { // TODO: Administrator override
            // The user from the session does not match the user it is trying to delete, regular users cannot delete
            // a user that is not their own.
            return sendResponse(response, httpStatus.FORBIDDEN, 'NotYourUser');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.pid', 'user.passwordHash'])
            .where('user.pid = :pid', {pid})
            .getOne();

        if (!user) {
            // The user PID was not found in the database
            return sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
            // The password did not match the password of the user we want to delete.
            return sendResponse(response, httpStatus.UNAUTHORIZED, 'WrongPassword');
        }

        await user.remove();
        return sendResponse(response, httpStatus.OK, 'UserDeleted');
    }

    constructor() {
        super();
        this.createGetRoute('/handshake', APIRouter.doHandShake);
        this.createPostRoute('/login', APIRouter.loginUser);
        this.createPostRoute('/logout', APIRouter.logoutUser);
        this.createPostRoute('/register', APIRouter.registerUser);
        this.createPostRoute('/change/username', APIRouter.changeUserUsername);
        this.createPostRoute('/change/password', APIRouter.changeUserPassword);
        this.createPostRoute('/change/email', APIRouter.changeUserEmail);
        this.createPostRoute('/delete', APIRouter.deleteUser);
        logger.info('Route defined: API');
    }
}
