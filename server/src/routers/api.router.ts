import { AccountInstance, Account } from '../models/account/account';
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
          model: Account,
          attributes: ['pid', 'keyID', 'vCode', 'name', 'isActive'],
        }]
      });
      request.session['user'] = myUser.id;
    } else {
      // DEBUG CODE, remove when login system is built
      myUser = await User.findOne({
        attributes: ['id', 'username', 'email'],
        where: {
          id: 1,
        },
        include: [{
          model: Account,
          attributes: ['pid', 'keyID', 'vCode', 'name', 'isActive'],
        }]
      });
      request.session['user'] = myUser.id;
      // END DEBUG CODE
    }
    response.status(200);
    // response.json({});
    response.json({
      username: myUser.username,
      email: myUser.email,
      // accounts: [],
      accounts: myUser.accounts.map(function (account: AccountInstance): Object {
        delete account.userId;
        return account.toJSON();
      }),
    });
  }
}
