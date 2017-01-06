/// <reference path="ems.d.ts" />

// NPM imports
import express = require('express');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import path = require('path');
import helmet = require('helmet');
import es = require('express-session');
import ems = require('express-mysql-session');

// ES6 imports
import { logger } from './controllers/logger.service';
import { db } from './controllers/db.service';
import { mainConfig } from './controllers/config.service';
import { defineUser } from './models/user/user';
import { defineCharacter } from './models/character/character';
import { APIRouter } from './routers/api.router';
import { SSORouter } from './routers/sso.router';
import { AngularRedirectRouter } from './routers/angular.router';


export class App {

  app: express.Application;
  sessionStore: any;
  sessionParser: any;
  cookieParser: any;

  /**
   * The main startup function for the application
   */
  async mainStartupSequence(): Promise<void> {
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

    app.use(cookieParser());

    // Connect to database
    db.connect();

    // Setup MySQL Session Store
    let MySQLStore = ems(es);
    this.sessionStore = new MySQLStore({}, db.get());

    // Configure Session Store
    this.sessionParser = es({
      name: mainConfig.get('session_key'),
      secret: mainConfig.get('session_secret'),
      store: this.sessionStore,
      resave: true,
      saveUninitialized: true,
      cookie: {
        // secure: true,
        httpOnly: false,
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
      },
    });

    app.use(this.sessionParser);

    // Define models in application
    await defineUser().catch(console.error.bind(console));
    await defineCharacter().catch(console.error.bind(console));

    // Use static client folder for serving assets
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Use routes
    app.use('/api', (new APIRouter()).router);
    app.use('/sso', (new SSORouter()).router);
    // Re-route all other requests to the Angular app
    app.use('*', (new AngularRedirectRouter()).router);

    // Set the application as an attribute on this class, so we can access it later
    this.app = app;

    logger.info('App startup done');
  }
}
