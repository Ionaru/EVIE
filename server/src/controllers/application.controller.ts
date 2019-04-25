import { WebServer } from '@ionaru/web-server';
import * as Sentry from '@sentry/node';
import * as appRoot from 'app-root-path';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as MySQLStore from 'express-mysql-session';
import * as es from 'express-session';
import * as helmet from 'helmet';
import * as path from 'path';
import { logger } from 'winston-pnp-logger';

import { config, esiCache } from '../index';
import { RequestLogger } from '../loggers/request.logger';
import { AngularRedirectRouter } from '../routers/angular.router';
import { APIRouter } from '../routers/api.router';
import { DataRouter } from '../routers/data.router';
import { ErrorRouter } from '../routers/error.router';
import { GlobalRouter } from '../routers/global.router';
import { SSORouter } from '../routers/sso.router';
import { UserRouter } from '../routers/user.router';
import { DatabaseConnection, db } from './database.controller';
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

        Sentry.init({
            dsn: 'https://4064eff091454347b283cc8b939a99a0@sentry.io/1318977',
            enabled: process.env.NODE_ENV === 'production',
            release: 'evie-server@0.6.0',
        });

        await new DatabaseConnection().connect();

        logger.info('Beginning Express startup');

        const expressApplication = express();
        logger.info('Express application constructed');

        expressApplication.use(Sentry.Handlers.requestHandler());

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
                httpOnly: true,
                maxAge: 6 * 60 * 60 * 1000, // 6 hours
                secure: config.getProperty('secure_only_cookies', true) as boolean,
            },
            name: config.getProperty('session_key') as string,
            resave: false,
            rolling: true,
            saveUninitialized: true,
            secret: config.getProperty('session_secret') as string,
            store: process.env.NODE_ENV === 'production' ? this.sessionStore : undefined,
        });

        expressApplication.use(this.sessionParser);

        logger.info('Express session store loaded');

        // Use static client folder for serving assets
        expressApplication.use(express.static(path.join(appRoot.toString(), '../client/dist/client/')));

        // Global router.
        expressApplication.use('*', new GlobalRouter().router);

        // Application routers.
        expressApplication.use('/api', new APIRouter().router);
        expressApplication.use(/\/api\/users?/, new UserRouter().router);
        expressApplication.use('/sso', new SSORouter().router);
        expressApplication.use('/data', new DataRouter().router);

        // Re-route all other requests to the Angular app.
        expressApplication.use('*', new AngularRedirectRouter().router);

        expressApplication.use(Sentry.Handlers.errorHandler());

        // Error router.
        expressApplication.use(ErrorRouter.errorRoute);

        logger.info('Express configuration set');

        logger.info('Reading files into cache');
        // CacheController.readCache();

        logger.info('App startup done');

        const serverPort = config.getProperty('server_port');
        this.webServer = new WebServer(expressApplication, Number(serverPort));

        this.socketServer = new SocketServer(this.webServer, this.sessionParser);

        await this.webServer.listen();
    }

    public async stop(error?: Error): Promise<void> {
        const exitCode = error ? 1 : 0;
        // Ensure the app exits when there is an exception during shutdown.
        process.on('uncaughtException', () => {
            Application.exit(exitCode);
        });
        process.on('unhandledRejection', (reason, p): void => {
            logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
            Application.exit(exitCode);
        });

        let quitMessage = 'Quitting';
        if (error) {
            quitMessage += ' because of an uncaught exception!';
            logger.error('Reason: ', error);
        }
        logger.warn(quitMessage);

        logger.info('Dumping cache to files');
        esiCache.dumpCache();

        if (this.webServer) {
            await this.webServer.close();
        }

        if (this.socketServer) {
            if (process.env.NODE_ENV === 'production') {
                this.socketServer.io.emit('STOP');
            }
            this.socketServer.io.close();
        }

        closeDBConnection().then();

        async function closeDBConnection() {
            if (db && db.orm) {
                await db.orm.close();
                logger.info('ORM connection closed');
            }
            await new Promise<void>(((resolve) => {
                if (db && db.pool) {
                    db.pool.end(() => {
                        logger.info('DB pool closed');
                        resolve();
                    });
                } else {
                    resolve();
                }
            }));
            Application.exit(exitCode);
        }
    }
}
