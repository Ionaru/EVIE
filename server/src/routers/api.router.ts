import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { User } from '../models/user.model';
import { BaseRouter } from './base.router';

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
    private static async doHandShake(request: Request, response: Response): Promise<Response> {

        if (!request.session!.user.id) {
            return BaseRouter.sendResponse(response, httpStatus.OK, 'NotLoggedIn');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.email', 'user.uuid', 'user.username', 'user.timesLogin', 'user.lastLogin'])
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        if (!user) {
            // No user found that matches the ID in the session.
            delete request.session!.user.id;
            return APIRouter.sendResponse(response, httpStatus.OK, 'NotLoggedIn');
        }

        user.timesLogin++;
        user.lastLogin = new Date();
        user.save().then();
        const userData = {
            characters: user.characters.map((character) => character.sanitizedCopy),
            email: user.email,
            username: user.username,
            uuid: user.uuid,
        };
        return APIRouter.sendResponse(response, httpStatus.OK, 'LoggedIn', userData);
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
    private static async loginUser(request: Request, response: Response): Promise<Response> {

        // Extract the username/email and password from the request
        const username = request.body.username;
        const password = request.body.password;

        if (!username || !password) {
            // Missing parameters
            return APIRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        const user: User | undefined = await User.doQuery()
            .addSelect(['user.passwordHash'])
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.username = :username', {username})
            .orWhere('user.email = :username', {username})
            .getOne();

        if (!user) {
            // No user with that username was found
            return APIRouter.sendResponse(response, httpStatus.NOT_FOUND, 'IncorrectLogin');
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) {
            // Password did not match the passwordHash
            return APIRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'IncorrectLogin');
        }

        request.session!.user.id = user.id;
        request.session!.user.uuid = user.uuid;
        user.timesLogin++;
        user.lastLogin = new Date();
        await user.save();

        logger.info(`User login: ${user.username} (${user.email})`);

        const userData = {
            characters: user.characters.map((character) => character.sanitizedCopy),
            email: user.email,
            username: user.username,
            uuid: user.uuid,
        };
        return APIRouter.sendResponse(response, httpStatus.OK, 'LoggedIn', userData);
    }

    /**
     * Destroy the user session.
     * path: /api/logout
     * method: POST
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async logoutUser(request: Request, response: Response): Promise<Response | void> {

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
    private static async registerUser(request: Request, response: Response): Promise<Response> {
        // Extract the form data from the request and trim the whitespace from the username and email.
        const username: string = request.body.username.trim();
        const email: string = request.body.email.trim();
        const password: string = request.body.password;

        if (!username || !email || !password) {
            // Missing parameters
            return APIRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
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

            return APIRouter.sendResponse(response, httpStatus.CONFLICT, 'Taken', {
                email_in_use: emailInUse,
                username_in_use: usernameInUse,
            });
        }

        const newUser = new User();
        newUser.email = email;
        newUser.passwordHash = bcrypt.hashSync(password);
        newUser.username = username;
        await newUser.save();

        logger.info(`New user: ${newUser.username} (${newUser.email})`);

        return APIRouter.sendResponse(response, httpStatus.OK, 'Registered', {
            email: newUser.email,
            username: newUser.username,
            uuid: newUser.uuid,
        });
    }

    /**
     * Change a password of a user
     * path: /api/change/password
     * method: POST
     * params:
     *  uuid: The UUID of the user
     *  oldPassword: The current password of the user
     *  newPassword: The new password
     * returns:
     *  200 PasswordChanged: The password was changed successfully
     *  403 WrongPassword: The oldPassword parameter did not match the user's current password
     *  401 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The UUID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async changeUserPassword(request: Request, response: Response): Promise<Response> {

        const uuid = request.body.uuid;
        const oldPassword = request.body.oldpassword;
        const newPassword = request.body.newpassword;

        if (!uuid || !oldPassword || !newPassword) { // TODO: Administrator override
            // Missing parameters
            return APIRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        if (uuid !== request.session!.user.uuid) { // TODO: Administrator override
            // The user from the session does not match the user it is trying to modify, regular users cannot delete
            // a user that is not their own.
            return APIRouter.sendResponse(response, httpStatus.FORBIDDEN, 'NotYourUser');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.uuid', 'user.passwordHash'])
            .where('user.uuid = :uuid', {uuid})
            .getOne();

        if (!user) { // TODO: Administrator override
            // The user UUID was not found in the database
            return APIRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        if (!bcrypt.compareSync(oldPassword, user.passwordHash)) { // TODO: Administrator override
            // The password did not match the password of the user we want to modify.
            return APIRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'WrongPassword');
        }

        user.passwordHash = bcrypt.hashSync(newPassword, 8);
        await user.save();
        return APIRouter.sendResponse(response, httpStatus.OK, 'PasswordChanged');
    }

    /**
     * Change the email address of a user
     * path: /api/change/email
     * method: POST
     * params:
     *  uuid: The UUID of the user
     *  password: The current password of the user
     *  newEmail: The new email address
     * returns:
     *  200 EmailChanged: The email was changed successfully
     *  409 EmailInUse: The email address is already in use by someone else
     *  401 WrongPassword: The password parameter did not match the user's current password
     *  403 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The UUID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async changeUserEmail(request: Request, response: Response): Promise<Response> {

        const uuid = request.body.uuid;
        const password = request.body.password;
        const newEmail = request.body.newemail;

        if (!uuid || !password || !newEmail) { // TODO: Administrator override
            // Missing parameters
            return APIRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        if (uuid !== request.session!.user.uuid) { // TODO: Administrator override
            // The user from the session does not match the user it is trying to modify, regular users cannot delete
            // a user that is not their own.
            return APIRouter.sendResponse(response, httpStatus.FORBIDDEN, 'NotYourUser');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.uuid', 'user.passwordHash'])
            .where('user.uuid = :uuid', {uuid})
            .getOne();

        if (!user) { // TODO: Administrator override
            // The user UUID was not found in the database
            return APIRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
            // The password did not match the password of the user we want to modify.
            return APIRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'WrongPassword');
        }

        const existingUser: User | undefined = await User.doQuery()
            .select(['user.id', 'user.uuid', 'user.passwordHash'])
            .where('user.username = :newEmail', {newEmail})
            .orWhere('user.email = :newEmail', {newEmail})
            .getOne();

        if (existingUser) {
            // The email provided was already in use
            return APIRouter.sendResponse(response, httpStatus.CONFLICT, 'EmailInUse');
        }

        // The new email is unique
        user.email = newEmail;
        await user.save();
        return APIRouter.sendResponse(response, httpStatus.OK, 'EmailChanged');
    }

    /**
     * Change the username of a user
     * path: /api/change/username
     * method: POST
     * params:
     *  uuid: The UUID of the user
     *  password: The current password of the user
     *  newUsername: The new username
     * returns:
     *  200 UsernameChanged: The username was changed successfully
     *  409 UsernameInUse: The username is already in use by someone else
     *  401 WrongPassword: The password parameter did not match the user's current password
     *  403 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The UUID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async changeUserUsername(request: Request, response: Response): Promise<Response> {

        const uuid = request.body.uuid;
        const password = request.body.password;
        const newUsername = request.body.newusername;

        if (!uuid || !password || !newUsername) { // TODO: Administrator override
            // Missing parameters
            return APIRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        if (uuid !== request.session!.user.uuid) { // TODO: Administrator override
            // The user from the session does not match the user it is trying to modify, regular users cannot delete
            // a user that is not their own.
            return APIRouter.sendResponse(response, httpStatus.FORBIDDEN, 'NotYourUser');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.uuid', 'user.passwordHash'])
            .where('user.uuid = :uuid', {uuid})
            .getOne();

        if (!user) {
            // The user UUID was not found in the database
            return APIRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
            // The password did not match the password of the user we want to modify.
            return APIRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'WrongPassword');
        }

        const existingUser: User | undefined = await User.doQuery()
            .select(['user.id', 'user.uuid', 'user.passwordHash'])
            .where('user.username = :newUsername', {newUsername})
            .orWhere('user.email = :newUsername', {newUsername})
            .getOne();

        if (existingUser) {
            // The username provided was already in use
            return APIRouter.sendResponse(response, httpStatus.CONFLICT, 'UsernameInUse');
        }

        user.username = newUsername;
        await user.save();
        return APIRouter.sendResponse(response, httpStatus.OK, 'UsernameChanged');
    }

    /**
     * Delete a user
     * path: /api/delete
     * method: POST
     * params:
     *  uuid: The uuid of the user to delete
     *  password: The password of the user to delete, for verification
     * returns:
     *  200 UserDeleted: The user was deleted successfully
     *  401 WrongPassword: The oldPassword parameter did not match the user's current password
     *  403 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The UUID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async deleteUser(request: Request, response: Response): Promise<Response> {

        const uuid = request.body.uuid;
        const password = request.body.password;

        if (!uuid || !password) { // TODO: Administrator override
            // Missing parameters
            return APIRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters');
        }

        if (uuid !== request.session!.user.uuid) { // TODO: Administrator override
            // The user from the session does not match the user it is trying to delete, regular users cannot delete
            // a user that is not their own.
            return APIRouter.sendResponse(response, httpStatus.FORBIDDEN, 'NotYourUser');
        }

        const user: User | undefined = await User.doQuery()
            .select(['user.id', 'user.uuid', 'user.passwordHash'])
            .where('user.uuid = :uuid', {uuid})
            .getOne();

        if (!user) {
            // The user UUID was not found in the database
            return APIRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        if (!bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
            // The password did not match the password of the user we want to delete.
            return APIRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'WrongPassword');
        }

        await user.remove();
        return APIRouter.sendResponse(response, httpStatus.OK, 'UserDeleted');
    }

    constructor() {
        super();
        this.createGetRoute('/handshake', APIRouter.doHandShake, false);
        this.createPostRoute('/login', APIRouter.loginUser);
        this.createPostRoute('/logout', APIRouter.logoutUser);
        this.createPostRoute('/register', APIRouter.registerUser);
        this.createPostRoute('/change/username', APIRouter.changeUserUsername, true);
        this.createPostRoute('/change/password', APIRouter.changeUserPassword, true);
        this.createPostRoute('/change/email', APIRouter.changeUserEmail, true);
        this.createPostRoute('/delete', APIRouter.deleteUser, true);
    }
}
