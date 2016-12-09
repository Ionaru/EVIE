/// <reference path="types.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import { logger } from './controllers/logger.service';
import { Router, Response, Request, NextFunction } from 'express';
import { db } from './controllers/db.service';
import * as es from 'express-session';
import * as ems from 'express-mysql-session';
import { mainConfig } from './controllers/config.service';
import { defineUser, User } from './models/user/user';
import { defineAccount, Account } from './models/account/account';

export class App {

  app: express.Application;
  sessionStore: any;

  async mainStartupSequence(): Promise<express.Application> {
    logger.info('Beginning app startup');

    const app: express.Application = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    db.connect();

    let MySQLStore = ems(es);
    this.sessionStore = new MySQLStore({}, db.get());
    app.use(es({
      name: mainConfig.get('session_key'),
      secret: mainConfig.get('session_secret'),
      store: this.sessionStore,
      resave: true,
      saveUninitialized: true
    }));

    await defineUser().catch(console.error.bind(console));
    await defineAccount().catch(console.error.bind(console));

    const apiRouter: Router = Router();
    apiRouter.all('/*', async(request: Request, response: Response, next: NextFunction) => {
      let myUser = await User.findOne({
        attributes: ['username', 'email'],
        where: {
          username: 'testUser',
        },
        include: [{
          model: Account,
          attributes: ['pid', 'keyID', 'vCode', 'name', 'isActive'],
        }]
      });

      response.json({
        username: myUser.username,
        email: myUser.email,
        accounts: myUser.accounts.map(function (account) {
          return account.toJSON();
        })
      });
    });

    app.all('/api', apiRouter);

    app.use(express.static(path.join(__dirname, '../../client/dist')));

    app.all('*', (req: any, res: any) => {
      console.log(`[TRACE] Server 404 request: ${req.originalUrl}`);
      res.status(200).sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });

    // Router for 404 errors
    app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
      // let error = new Error("Not Found");
      err.status = 404;
      next(err);
    });

    logger.info('App startup done');
    this.app = app;
    return app;
  }
}
