import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as MySQLStore from 'express-mysql-session';
import * as es from 'express-session';
import * as helmet from 'helmet';
import * as path from 'path';
import { logger } from 'winston-pnp-logger';

import { RequestLogger } from '../loggers/request.logger';
import { AngularRedirectRouter } from '../routers/angular.router';
import { APIRouter } from '../routers/api.router';
import { DataRouter } from '../routers/data.router';
import { ErrorRouter } from '../routers/error.router';
import { GlobalRouter } from '../routers/global.router';
import { SSORouter } from '../routers/sso.router';
import { config } from './configuration.controller';
import { DatabaseConnection, db } from './database.controller';
import { WebServer } from './server.controller';
import { SocketServer } from './socket.controller';

export class Application {

    private static exit(exitCode: number) {
        logger.info('Shutting down');
        process.exit(exitCode);
    }

    public sessionStore?: es.Store;
    public sessionParser?: express.RequestHandler;

    private webServer?: WebServer;
    private socketServer?: SocketServer;

    public async start() {
        await new DatabaseConnection().connect();

        logger.info('Beginning Express startup');

        const expressApplication = express();
        logger.info('Express application constructed');

        // Request logger
        expressApplication.use(RequestLogger.logRequest());

        // Security options
        expressApplication.use(cors({
            credentials: true,
            origin: 'http://192.168.2.11:8100',
        }));
        expressApplication.use(helmet());
        expressApplication.set('trust proxy', 1);

        // Setup bodyParser
        expressApplication.use(bodyParser.json() as any);
        expressApplication.use(bodyParser.urlencoded({extended: true}) as any);

        expressApplication.use(compression());

        // Setup MySQL Session Storage
        this.sessionStore = new MySQLStore({
            schema: {
                columnNames: {
                    data: 'data',
                    expires: 'expires',
                    session_id: 'session_id',
                },
                tableName: 'session',
            },
        }, db.pool) as any;

        // Configure Session Parser
        this.sessionParser = es({
            cookie: {
                httpOnly: false,
                maxAge: 6 * 60 * 60 * 1000, // 6 hours
                secure: config.getProperty('secure_only_cookies', true) as boolean,
            },
            name: config.getProperty('session_key') as string,
            resave: false,
            rolling: true,
            saveUninitialized: true,
            secret: config.getProperty('session_secret') as string,
            store: this.sessionStore,
        });

        expressApplication.use(this.sessionParser);

        logger.info('Session store loaded');

        // Use static client folder for serving assets
        expressApplication.use(express.static(path.join(__dirname, '../../../client/dist')));

        // Global router.
        expressApplication.use('*', new GlobalRouter().router);

        // Application routers.
        expressApplication.use('/api', new APIRouter().router);
        expressApplication.use('/sso', new SSORouter().router);
        expressApplication.use('/data', new DataRouter().router);

        // Re-route all other requests to the Angular app.
        expressApplication.use('*', new AngularRedirectRouter().router);

        // Error router.
        expressApplication.use(ErrorRouter.errorRoute);

        logger.info('Express configuration set');

        // Do caching here.

        logger.info('App startup done');

        this.webServer = new WebServer(expressApplication);

        this.socketServer = new SocketServer(this.webServer, this.sessionParser);
    }

    public async stop(error?: Error): Promise<void> {
        const exitCode = error ? 1 : 0;
        // Ensure the app exits when there is an exception during shutdown.
        process.on('uncaughtException', () => {
            Application.exit(exitCode);
        });
        process.on('unhandledRejection', (reason: string, p: Promise<any>): void => {
            logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
            Application.exit(exitCode);
        });

        let quitMessage = 'Quitting';
        if (error) {
            quitMessage += ' because of an uncaught exception!';
            logger.error('Reason: ', error);
        }
        logger.warn(quitMessage);

        if (this.socketServer) {
            this.socketServer.io.emit('STOP');
            this.socketServer.io.close();
        }

        if (this.webServer) {
            this.webServer.server.close(async () => {
                logger.info('HTTP server closed');
                closeDBConnection().then();
            });
        } else {
            closeDBConnection().then();
        }

        async function closeDBConnection() {
            if (db && db.orm) {
                await db.orm.close();
                logger.info('ORM connection closed');
            }
            if (db && db.pool) {
                db.pool.end(() => {
                    logger.info('DB pool closed');
                    Application.exit(exitCode);
                });
            } else {
                Application.exit(exitCode);
            }
        }
    }
}
