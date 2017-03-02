import bcrypt = require('bcryptjs');

import { CharacterInstance, Character } from '../models/character/character';
import { User, UserInstance } from '../models/user/user';
import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter, sendResponse } from './base.router';
import { generateUniquePID } from '../controllers/pid.service';

export class APIRouter extends BaseRouter {

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
    if (request.session['user'].id) {
      const user: UserInstance = await User.findOne({
        attributes: ['id', 'passwordHash', 'timesLogin', 'pid', 'username', 'email'],
        where: {
          id: request.session['user'].id,
        },
        include: [{
          model: Character,
          attributes: ['pid', 'accessToken', 'tokenExpiry', 'characterId', 'scopes', 'ownerHash', 'name', 'isActive'],
        }]
      });
      user.timesLogin++;
      user.lastLogin = new Date();
      await user.save();
      const userData = {
        pid: user.pid,
        username: user.username,
        email: user.email,
        characters: user.characters.map((character: CharacterInstance): Object => {
          delete character.userId;
          return character.toJSON();
        }),
      };
      sendResponse(response, 200, 'LoggedIn', userData);
    } else {
      sendResponse(response, 200, 'NotLoggedIn');
    }
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
   *  400 IncorrectLogin: When the username was not found
   *  400 IncorrectLogin: When the password did not match the found username
   */
  private static async loginUser(request: Request, response: Response): Promise<void> {
    // Extract the username/email and password from the request
    const username = request.body.username;
    const password = request.body.password;

    const user: UserInstance = await User.findOne({
      attributes: ['id', 'passwordHash', 'timesLogin', 'pid', 'username', 'email'],
      where: {
        $or: [
          {username: username},
          {email: username}
        ],
      },
      include: [{
        model: Character,
        attributes: ['pid', 'accessToken', 'tokenExpiry', 'characterId', 'scopes', 'ownerHash', 'name', 'isActive'],
      }]
    });

    if (user) {
      if (bcrypt.compareSync(password, user.passwordHash)) {
        request.session['user'].id = user.id;
        request.session['user'].pid = user.pid;
        user.timesLogin++;
        user.lastLogin = new Date();
        await user.save();
        logger.info(user.username + ' logged in.');
        const userData = {
          pid: user.pid,
          username: user.username,
          email: user.email,
          characters: user.characters.map((character: CharacterInstance): Object => {
            delete character.userId;
            return character.toJSON();
          }),
        };
        sendResponse(response, 200, 'LoggedIn', userData);

      } else {

        // Password did not match the passwordHash
        sendResponse(response, 400, 'IncorrectLogin');
      }

    } else {

      // No user with that username was found
      sendResponse(response, 400, 'IncorrectLogin');
    }
  }

  /**
   * Destroy the user session and redirect them back to the homepage.
   * path: /api/logout
   * method: POST
   */
  private static logoutUser(request: Request, response: Response): void {
    request.session.destroy(() => {
      response.redirect('/');
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
    const username = request.body.username.trim();
    const email = request.body.email.trim();
    const password = request.body.password;

    let user: UserInstance = await User.findOne({
      where: {
        $or: [
          // To prevent conflicts in username/email combination, both the username and email may only exist once in the
          // database.
          {username: username},
          {username: email},
          {email: email},
          {email: username},
        ],
      }
    });

    if (!user) {
      user = await User.create({
        pid: await generateUniquePID(8, User),
        username: username,
        passwordHash: bcrypt.hashSync(password, 8),
        email: email,
      });

      sendResponse(response, 200, 'Registered', {
        pid: user.pid,
        username: user.username,
        email: user.email,
      });

    } else {

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

      sendResponse(response, 409, 'Taken', {
        username_in_use: usernameInUse,
        email_in_use: emailInUse,
      });
    }
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

    if (request.session['user']) {

      const pid = request.body.pid;
      const oldPassword = request.body.oldpassword;
      const newPassword = request.body.newpassword;

      if (pid && oldPassword && newPassword) { // TODO: Administrator override

        const user: UserInstance = await User.findOne({
          attributes: ['id', 'passwordHash', 'pid'],
          where: {
            pid: pid,
          }
        });

        if (user) {

          if (pid === request.session['user'].pid) { // TODO: Administrator override
            // The user from the session is the same as the one it is trying to modify, this is allowed

            if (bcrypt.compareSync(oldPassword, user.passwordHash)) { // TODO: Administrator override
              // The user password was correct, we can now change the user's password

              user.passwordHash = bcrypt.hashSync(newPassword, 8);
              await user.save();
              sendResponse(response, 200, 'PasswordChanged');

            } else {

              // The password did not match the password of the user we want to modify.
              sendResponse(response, 403, 'WrongPassword');
            }

          } else {

            // The user from the session does not match the user it is trying to modify, regular users cannot modify
            // a user that is not their own.
            sendResponse(response, 401, 'NotYourUser');
          }

        } else {

          // The user PID was not found in the database
          sendResponse(response, 404, 'UserNotFound');
        }

      } else {

        // Missing parameters
        sendResponse(response, 400, 'MissingParameters');
      }

    } else {

      // User is not logged in and isn't allowed to change a password
      sendResponse(response, 401, 'NotLoggedIn');
    }
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
   *  403 WrongPassword: The password parameter did not match the user's current password
   *  401 NotYourUser: A user tried to change another user's password
   *  404 UserNotFound: The PID did not match any known user
   *  400 MissingParameters: One of the parameters was missing
   *  401 NotLoggedIn: The user session was not found, possibly not logged in
   */
  private static async changeUserEmail(request: Request, response: Response): Promise<void> {

    if (request.session['user']) {
      // A user session is active

      const pid = request.body.pid;
      const password = request.body.password;
      const newEmail = request.body.newemail;

      if (pid && password && newEmail) { // TODO: Administrator override

        const user: UserInstance = await User.findOne({
          attributes: ['id', 'passwordHash', 'pid'],
          where: {
            pid: pid,
          }
        });

        if (user) {
          // A user exists with this PID

          if (pid === request.session['user'].pid) { // TODO: Administrator override
            // The user from the session is the same as the one it is trying to modify, this is allowed

            if (bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
              // The user password was correct, we can now try to change the user's email

              const existingUser: UserInstance = await User.findOne({
                attributes: ['id', 'username', 'email'],
                where: {
                  $or: [
                    {username: newEmail},
                    {email: newEmail},
                  ],
                }
              });

              if (!existingUser) {

                // The new email is unique
                user.email = newEmail;
                await user.save();
                sendResponse(response, 200, 'EmailChanged');

              } else {

                // The email provided was already in use
                sendResponse(response, 409, 'EmailInUse');
              }

            } else {

              // The password did not match the password of the user we want to modify.
              sendResponse(response, 403, 'WrongPassword');
            }

          } else {

            // The user from the session does not match the user it is trying to modify, regular users cannot delete
            // a user that is not their own.
            sendResponse(response, 401, 'NotYourUser');
          }

        } else {

          // The user PID was not found in the database
          sendResponse(response, 404, 'UserNotFound');
        }

      } else {

        // Missing parameters
        sendResponse(response, 400, 'MissingParameters');
      }

    } else {

      // User is not logged in and isn't allowed to change an email
      sendResponse(response, 401, 'NotLoggedIn');
    }
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
   *  403 WrongPassword: The password parameter did not match the user's current password
   *  401 NotYourUser: A user tried to change another user's password
   *  404 UserNotFound: The PID did not match any known user
   *  400 MissingParameters: One of the parameters was missing
   *  401 NotLoggedIn: The user session was not found, possibly not logged in
   */
  private static async changeUserUsername(request: Request, response: Response): Promise<void> {

    if (request.session['user']) {
      // A user session is active

      const pid = request.body.pid;
      const password = request.body.password;
      const newUsername = request.body.newusername;

      if (pid && password && newUsername) { // TODO: Administrator override

        const user: UserInstance = await User.findOne({
          attributes: ['id', 'passwordHash', 'pid'],
          where: {
            pid: pid,
          }
        });

        if (user) {
          // A user exists with this PID

          if (pid === request.session['user'].pid) { // TODO: Administrator override
            // The user from the session is the same as the one it is trying to modify, this is allowed

            if (bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
              // The user password was correct, we can now try to change the user's username

              const existingUser: UserInstance = await User.findOne({
                attributes: ['id', 'username', 'email'],
                where: {
                  $or: [
                    {username: newUsername},
                    {email: newUsername},
                  ],
                }
              });

              if (!existingUser) {

                // The new username is unique
                user.username = newUsername;
                await user.save();
                sendResponse(response, 200, 'UsernameChanged');

              } else {

                // The username provided was already in use
                sendResponse(response, 409, 'UsernameInUse');
              }

            } else {

              // The password did not match the password of the user we want to modify.
              sendResponse(response, 403, 'WrongPassword');
            }

          } else {

            // The user from the session does not match the user it is trying to modify, regular users cannot delete
            // a user that is not their own.
            sendResponse(response, 401, 'NotYourUser');
          }

        } else {

          // The user PID was not found in the database
          sendResponse(response, 404, 'UserNotFound');
        }

      } else {

        // Missing parameters
        sendResponse(response, 400, 'MissingParameters');
      }

    } else {

      // User is not logged in and isn't allowed to change a username
      sendResponse(response, 401, 'NotLoggedIn');
    }
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
   *  403 WrongPassword: The oldPassword parameter did not match the user's current password
   *  401 NotYourUser: A user tried to change another user's password
   *  404 UserNotFound: The PID did not match any known user
   *  400 MissingParameters: One of the parameters was missing
   *  401 NotLoggedIn: The user session was not found, possibly not logged in
   */
  private static async deleteUser(request: Request, response: Response): Promise<void> {

    if (request.session['user']) {
      // A user session is active

      const pid = request.body.pid;
      const password = request.body.password;

      if (pid && password) { // TODO: Administrator override

        const user: UserInstance = await User.findOne({
          attributes: ['id', 'passwordHash', 'pid'],
          where: {
            pid: pid,
          }
        });

        if (user) {
          // A user exists with this PID

          if (pid === request.session['user'].pid) { // TODO: Administrator override
            // The user from the session is the same as the one it is trying to delete, this is allowed

            if (bcrypt.compareSync(password, user.passwordHash)) { // TODO: Administrator override
              // The user password was correct, we can now delete the user

              await user.destroy();
              sendResponse(response, 200, 'UserDeleted');

            } else {

              // The password did not match the password of the user we want to delete.
              sendResponse(response, 403, 'WrongPassword');
            }

          } else {

            // The user from the session does not match the user it is trying to delete, regular users cannot delete
            // a user that is not their own.
            sendResponse(response, 401, 'NotYourUser');
          }

        } else {

          // The user PID was not found in the database
          sendResponse(response, 404, 'UserNotFound');
        }

      } else {

        // Missing parameters
        sendResponse(response, 400, 'MissingParameters');
      }

    } else {

      // User is not logged in
      sendResponse(response, 401, 'NotLoggedIn');
    }
  }
}
