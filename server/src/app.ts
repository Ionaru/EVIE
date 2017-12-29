import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as ems from 'express-mysql-session';
import { RequestHandler } from 'express-serve-static-core';
import { Store } from 'express-session';
import * as es from 'express-session';
import * as helmet from 'helmet';
import * as path from 'path';
import 'reflect-metadata'; // Required by TypeORM.
import { logger, WinstonPnPLogger } from 'winston-pnp-logger';

import { AngularRedirectRouter } from './routers/angular.router';
import { APIRouter } from './routers/api.router';
import { errorHandler } from './routers/base.router';
import { GlobalRouter } from './routers/global.router';
import { SSORouter } from './routers/sso.router';
import { config, Configurator } from './services/config.service';
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
                announceSelf: false,
                logDir: '../logs',
            });
        }

        // Load the configuration files
        new Configurator();
        config.addConfigFile('main');
        config.addConfigFile('database');
        config.addConfigFile('sso');

        logger.info('Beginning app startup');

        // Create the Express Application
        const app: express.Application = express();

        // Always wear a Helmet!
        app.use(helmet());

        // Additional security options
        app.set('trust proxy', 1);

        // Setup bodyParser
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: true}));

        // Connect to database
        await db.connect()
            .then(() => logger.info('Database connected'))
            .catch((error) => logger.error(error));

        // Setup MySQL Session Store
        const mySQLStore = ems(es);
        this.sessionStore = new mySQLStore({
            schema: {
                columnNames: {
                    data: 'data',
                    expires: 'expires',
                    session_id: 'session_id',
                },
                tableName: 'session',
            },
        }, db.getPool());

        // Configure Session Store
        this.sessionParser = es({
            cookie: {
                httpOnly: false,
                maxAge: 6 * 60 * 60 * 1000, // 6 hours
                secure: config.getProperty('secure_only_cookies') || false,
            },
            name: config.getProperty('session_key'),
            resave: true,
            rolling: true,
            saveUninitialized: true,
            secret: config.getProperty('session_secret'),
            store: this.sessionStore,
        });

        app.use(this.sessionParser);

        logger.info('Session store loaded');

        // Use static client folder for serving assets
        app.use(express.static(path.join(__dirname, '../../client/dist')));

        // Put all requests through a global router first
        app.use('*', (new GlobalRouter()).router);

        // Use routes
        app.use('/api', (new APIRouter()).router);
        app.use('/sso', (new SSORouter()).router);

        // Re-route all other requests to the Angular app
        app.use('*', (new AngularRedirectRouter()).router);

        app.use(errorHandler);

        // Set the application as an attribute on this class, so we can access it later
        this.app = app;

        logger.info('App startup done');
    }
}
