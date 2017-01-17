import bcrypt = require('bcrypt-nodejs');

import { CharacterInstance, Character } from '../models/character/character';
import { User, UserInstance } from '../models/user/user';
import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter } from './base.router';
import { generateUniquePID } from '../controllers/pid.service';

export class APIRouter extends BaseRouter {

  constructor() {
    super();
    this.createPostRoute('/login', APIRouter.loginUser);
    this.createPostRoute('/logout', APIRouter.logoutUser);
    this.createPostRoute('/register', APIRouter.registerUser);
    // this.createPostRoute('/change/username', APIRouter.changeUserUsername);
    // this.createPostRoute('/change/password', APIRouter.changeUserPassword);
    // this.createPostRoute('/change/email', APIRouter.changeUserEmail);
    this.createDeleteRoute('/delete', APIRouter.deleteUser);
    logger.info('Route defined: API');
  }

  // TODO: Route for changing a password
  // TODO: Route for changing a username
  // TODO: Route for changing an email address
  // TODO: Route for resetting a password
  // TODO: Route to delete a user

  /**
   * Check a User's username/email and password, then add the User id to the current session.
   * path: /api/login
   * method: POST
   * params:
   *  username: The username or email of the registered user
   *  password: The password matching the registered user
   */
  private static async loginUser(request: Request, response: Response): Promise<void> {
    // Extract the username/email and password from the request
    let username = request.body.username;
    let password = request.body.password;

    let user: UserInstance = await User.findOne({
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
        request.session['user'] = user.toJSON();
        user.timesLogin++;
        user.lastLogin = new Date();
        await user.save();
        logger.info(user.username + ' logged in.');
        response.json({
          state: 'success',
          message: 'LoggedIn',
          data: {
            pid: user.pid,
            username: user.username,
            email: user.email,
            characters: user.characters.map(function (character: CharacterInstance): Object {
              delete character.userId;
              return character.toJSON();
            }),
          }
        });
      } else {
        // Password did not match the passwordHash
        response.status(400);
        response.json({
          state: 'error',
          message: 'IncorrectLogin'
        });
      }
    } else {
      // No user with that username was found
      response.status(400);
      response.json({
        state: 'error',
        message: 'IncorrectLogin'
      });
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
   */
  private static async registerUser(request: Request, response: Response): Promise<void> {
    // Extract the form data from the request and trim the whitespace from the username and email.
    let username = request.body.username.trim();
    let email = request.body.email.trim();
    let password = request.body.password;

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
        passwordHash: bcrypt.hashSync(password),
        email: email,
      });
      response.json({
        state: 'success',
        message: 'Registered',
        data: {
          pid: user.pid,
          username: user.username,
          email: user.email,
        }
      });
    } else {
      response.status(409);
      // The regular expression checks if the username or email matched the one from the user in the database
      // this is done to return an accurate error message.
      let existingUsername = new RegExp('^' + user.username + '$', 'i');
      let existingEmail = new RegExp('^' + user.email + '$', 'i');
      let usernameAvailable = true;
      let emailAvailable = true;
      if (username.match(existingUsername) || username.match(existingEmail)) {
        usernameAvailable = false;
      }
      if (email.match(existingEmail) || email.match(existingUsername)) {
        emailAvailable = false;
      }
      response.json({
        state: 'error',
        message: 'Taken',
        data: {
          username_available: usernameAvailable,
          email_available: emailAvailable,
        }
      });
    }
  }

  // private static async changeUserPassword(request: Request, response: Response): Promise<void> {
  //
  //   if (!request.session['user']) {
  //
  //     // User is not logged in and isn't allowed to change a password
  //     response.status(401);
  //     response.json({state: 'error',
  //       message: 'NotLoggedIn'});
  //
  //   } else {
  //
  //     let pid = request.body.pid;
  //     let oldPassword = request.body.oldpassword;
  //     let newPassword = request.body.newpassword;
  //   }
  // }
  //
  // private static async changeUserEmail(request: Request, response: Response): Promise<void> {
  //
  //   if (!request.session['user']) {
  //
  //     // User is not logged in and isn't allowed to change an email
  //     response.status(401);
  //     response.json({state: 'error',
  //       message: 'NotLoggedIn'});
  //
  //   } else {
  //     let pid = request.body.pid;
  //     let password = request.body.password;
  //     let newEmail = request.body.newemail;
  //   }
  //
  //
  // }
  //
  // private static async changeUserUsername(request: Request, response: Response): Promise<void> {
  //
  //   if (!request.session['user']) {
  //
  //     // User is not logged in and isn't allowed to change a username
  //     response.status(401);
  //     response.json({state: 'error',
  //       message: 'NotLoggedIn'});
  //
  //   } else {
  //     let pid = request.body.pid;
  //     let password = request.body.password;
  //     let newUsername = request.body.newusername;
  //   }
  // }

  /**
   * Register a new user using a username, email and password.
   * path: /api/delete
   * method: DELETE
   * params:
   *  pid: The pid of the user to delete
   *  password: The password of the user to delete, for verification
   */
  private static async deleteUser(request: Request, response: Response): Promise<void> {

    if (!request.session['user']) {

      // User is not logged in
      response.status(401);
      response.json({
        state: 'error',
        message: 'NotLoggedIn'
      });

    } else {
      let pid = request.body.pid;
      let password = request.body.password;

      let user: UserInstance = await User.findOne({
        attributes: ['id', 'passwordHash', 'pid'],
        where: {
          pid: pid,
        }
      });

      if (user && pid === request.session['user'].pid) {

        if (bcrypt.compareSync(password, user.passwordHash)) {

          await user.destroy();
          response.json({
            state: 'success',
            message: 'UserDeleted'
          });

        } else {

          response.status(401);
          response.json({
            state: 'error',
            message: 'WrongPassword'
          });
        }

      } else {

        response.status(404);
        response.json({
          state: 'error',
          message: 'UserNotFound'
        });
      }
    }
  }
}
