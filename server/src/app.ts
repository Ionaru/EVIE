// NPM imports
import express = require('express');
import bodyParser = require('body-parser');
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
import { GlobalRouter } from './routers/global.router';


export class App {

  app: express.Application;
  sessionStore: any;
  sessionParser: any;

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

    // Connect to database
    db.connect();

    // Setup MySQL Session Store
    const MySQLStore = ems(es);
    this.sessionStore = new MySQLStore({}, db.get());

    // Configure Session Store
    this.sessionParser = es({
      name: mainConfig.get('session_key'),
      secret: mainConfig.get('session_secret'),
      store: this.sessionStore,
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: mainConfig.get('secure_only_cookies') || false,
        httpOnly: false,
        maxAge: 6 * 60 * 60 * 1000 // 6 hours
      },
    });

    app.use(this.sessionParser);

    // Define models in application
    await defineUser().catch(console.error.bind(console));
    await defineCharacter().catch(console.error.bind(console));

    // Use static client folder for serving assets
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Put all requests through a global router first
    app.use('*', (new GlobalRouter()).router);

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
