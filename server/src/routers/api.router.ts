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
   *  username:
   *  password:
   */
  private static async loginUser(request: Request, response: Response): Promise<void> {
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
        request.session['user'] = user.id;
        user.timesLogin++;
        user.lastLogin = new Date();
        await user.save();
        response.json({
          state: 'success',
          message: 'LoggedIn',
          data: {
            pid: user.pid,
            username: user.username,
            email: user.email,
            characters: user.characters.map(function (character: CharacterInstance): Object {
              delete character.userId;
              logger.info(user.username + ' logged in.');
              return character.toJSON();
            }),
          }
        });
      } else {
        response.status(400);
        response.json({
          state: 'error',
          message: 'IncorrectLogin'
        });
      }
    } else {
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
   *  username:
   *  email:
   *  password:
   */
  private static async registerUser(request: Request, response: Response): Promise<void> {
    let username = request.body.username;
    let email = request.body.email;
    let password = request.body.password;

    let user: UserInstance = await User.findOne({
      where: {
        $or: [
          {username: username},
          {email: email}
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
      let existingUsername = new RegExp(user.username, 'i');
      let existingEmail = new RegExp(user.email, 'i');
      if (username.match(existingUsername) && email.match(existingEmail)) {
        response.json({
          state: 'error',
          message: 'BothTaken'
        });
      } else if (username.match(existingUsername)) {
        response.json({
          state: 'error',
          message: 'UsernameTaken'
        });
      } else if (email.match(existingEmail)) {
        response.json({
          state: 'error',
          message: 'EmailTaken'
        });
      } else {
        response.json({
          state: 'error',
          message: 'Taken'
        });
      }
    }
  }
}
