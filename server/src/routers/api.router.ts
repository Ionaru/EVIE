import { CharacterInstance, Character } from '../models/character/character';
import { User, UserInstance } from '../models/user/user';
import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter } from './base.router';

export class APIRouter extends BaseRouter {

  constructor() {
    super();
    this.createAllRoute('/', APIRouter.debugAPI);
    logger.info('Route defined: API');
  }

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
    response.status(200);
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
}
