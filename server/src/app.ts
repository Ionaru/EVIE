/// <reference path="types.d.ts" />

// NPM imports
import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');
import helmet = require('helmet');
import es = require('express-session');
import ems = require('express-mysql-session');
import Sequelize = require('sequelize');
import Instance = Sequelize.Instance;

// ES6 imports
import { logger } from './controllers/logger.service';
import { Router, Response, Request } from 'express';
import { db } from './controllers/db.service';
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

    // Add a Helmet for protection
    app.use(helmet());

    // Additional security options
    app.set('trust proxy', 1);

    // Setup bodyParser
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    // Connect to database
    db.connect();

    // Setup MySQL Session Store
    let MySQLStore = ems(es);
    this.sessionStore = new MySQLStore({}, db.get());
    let expiryDate = new Date(Date.now() + 60 * 60 * 1000);
    app.use(es({
      name: mainConfig.get('session_key'),
      secret: mainConfig.get('session_secret'),
      store: this.sessionStore,
      resave: true,
      saveUninitialized: true,
      cookie: {
        // secure: true,
        httpOnly: true,
        expires: expiryDate
      },
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
      response.status(200);
      // response.json({});
      response.json({
        username: myUser.username,
        email: myUser.email,
        accounts: myUser.accounts.map(function (account: Instance<Object>): Object {
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
