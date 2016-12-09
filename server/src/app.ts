/// <reference path="types.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import { logger } from './controllers/logger.service';
import { Router, Response, Request } from 'express';
import { db } from './controllers/db.service';
import * as es from 'express-session';
import * as ems from 'express-mysql-session';
import { mainConfig } from './controllers/config.service';
import { defineUser, User } from './models/user/user';
import { defineAccount, Account } from './models/account/account';

export class App {

  app: express.Application;
  sessionStore: any;

  /**
   * The main startup function for the application
   */
  async mainStartupSequence(): Promise<express.Application> {
    logger.info('Beginning app startup');

    // Create the Express Application
    const app: express.Application = express();

    // Setup bodyParser
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    // Connect to database
    db.connect();

    // Setup MySQL Session Store
    let MySQLStore = ems(es);
    this.sessionStore = new MySQLStore({}, db.get());
    app.use(es({
      name: mainConfig.get('session_key'),
      secret: mainConfig.get('session_secret'),
      store: this.sessionStore,
      resave: true,
      saveUninitialized: true
    }));

    // Define models in application
    await defineUser().catch(console.error.bind(console));
    await defineAccount().catch(console.error.bind(console));

    // Define routers in application
    const apiRouter: Router = Router();
    apiRouter.all('/*', async(request: Request, response: Response) => {
      let myUser;
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

      response.json({
        username: myUser.username,
        email: myUser.email,
        accounts: myUser.accounts.map(function (account) {
          return account.toJSON();
        }),
      });
    });

    // Use routers
    app.all('/api', apiRouter);

    // Use static client folder for serving assets
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Re-route all other requests to the Angular app
    app.all('*', (request: Request, response: Response) => {
      response.status(200).sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });

    // Set the application as an attribute on this class, so we can access it later
    this.app = app;

    logger.info('App startup done');

    // Forced return because this is an async function
    return;
  }
}
