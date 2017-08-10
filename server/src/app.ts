// NPM imports
import bodyParser = require('body-parser');
import express = require('express');
import ems = require('express-mysql-session');
import es = require('express-session');
import helmet = require('helmet');
import path = require('path');
import { logger, WinstonPnPLogger } from 'winston-pnp-logger';
import configService = require('./services/config.service');

// ES6 imports
import { RequestHandler } from 'express-serve-static-core';
import { Store } from 'express-session';
import { defineCharacter } from './models/character/character';
import { defineUser } from './models/user/user';
import { AngularRedirectRouter } from './routers/angular.router';
import { APIRouter } from './routers/api.router';
import { GlobalRouter } from './routers/global.router';
import { SSORouter } from './routers/sso.router';
import { Config, mainConfig } from './services/config.service';
import { db } from './services/db.service';

export class App {

  public app: express.Application;
  public sessionStore: Store;
  public sessionParser: RequestHandler;

  /**
   * The main startup function for the application
   */
  public async mainStartupSequence(): Promise<void> {
    // Create the logger, now we can use Winston for logging
    if (!logger) {
      new WinstonPnPLogger({
        logDir: '../logs',
      });
    }

    // Load the configuration files
    configService.mainConfig = new Config('main');
    configService.dbConfig = new Config('database');
    configService.ssoConfig = new Config('sso');

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
    const mySQLStore = ems(es);
    this.sessionStore = new mySQLStore({}, db.getPool());

    // Configure Session Store
    this.sessionParser = es({
      cookie: {
        httpOnly: false,
        maxAge: 6 * 60 * 60 * 1000, // 6 hours
        secure: mainConfig.getProperty('secure_only_cookies') || false,
      },
      name: mainConfig.getProperty('session_key'),
      resave: true,
      rolling: true,
      saveUninitialized: true,
      secret: mainConfig.getProperty('session_secret'),
      store: this.sessionStore,
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
