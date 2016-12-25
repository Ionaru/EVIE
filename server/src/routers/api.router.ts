import Sequelize = require('sequelize');
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
    this.createGetRoute('/', APIRouter.debugAPI);
    this.createPostRoute('/login', APIRouter.loginUser);
    this.createPostRoute('/register', APIRouter.registerUser);
    this.createPostRoute('/logout', APIRouter.logoutUser);
    logger.info('Route defined: API');
  }

  // TODO: Change password route
  // TODO: Change username route
  // TODO: Change email route
  // TODO: Reset password route

  private static async debugAPI(request: Request, response: Response): Promise<void> {
    let myUser: UserInstance;
    if (request.session['user']) {
      myUser = await User.findOne({
        attributes: ['id', 'username', 'email'],
        where: {
          id: request.session['user'],
        },
        include: [{
          model: Character,
          attributes: ['pid', 'accessToken', 'tokenExpiry', 'characterId', 'scopes', 'ownerHash', 'name', 'isActive'],
        }]
      });
      request.session['user'] = myUser.id;
    } else {
      // DEBUG CODE, remove when login system is built
      myUser = await User.findOne({
        attributes: ['id', 'pid', 'username', 'email'],
        where: {
          id: 1,
        },
        include: [{
          model: Character,
          attributes: ['pid', 'accessToken', 'tokenExpiry', 'characterId', 'scopes', 'ownerHash', 'name', 'isActive'],
        }]
      });
      request.session['user'] = myUser.id;
      // END DEBUG CODE
    }
    // response.json({});
    response.json({
      pid: myUser.pid,
      username: myUser.username,
      email: myUser.email,
      // character: [],
      character: myUser.characters.map(function (character: CharacterInstance): Object {
        delete character.userId;
        return character.toJSON();
      }),
    });
  }

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
      attributes: ['id', 'passwordHash', 'timesLogin'],
      where: {
        $or: [
          {username: username},
          {email: username}
        ],
      }
    });

    if (user) {
      if (bcrypt.compareSync(password, user.passwordHash)) {
        request.session['user'] = user.id;
        user.timesLogin++;
        user.lastLogin = new Date();
        await user.save();
        response.json({
          success: "LoggedIn"
        });
      } else {
        response.status(400);
        response.json({
          error: "BadPassword"
        });
      }
    } else {
      response.status(404);
      response.json({
        error: "UserDoesNotExist"
      });
    }
  }

  /**
   * Destroy the user session and redirect them back to the homepage.
   * path: /api/logout
   * method: POST
   */
  private static async logoutUser(request: Request, response: Response): Promise<void> {
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
        success: "Registered",
        pid: user.pid
      });
    } else {
      response.status(409);
      if (user.username === username && user.email === email) {
        response.json({
          error: "BothTaken"
        });
      }
      else if (user.username === username) {
        response.json({
          error: "UsernameTaken"
        });
      }
      else if (user.email === email) {
        response.json({
          error: "EmailTaken"
        });
      }
    }
  }
}
