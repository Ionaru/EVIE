import * as path from 'path';

import { WebServer } from '@ionaru/web-server';
import * as Sentry from '@sentry/node';
import * as appRoot from 'app-root-path';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as MySQLStore from 'express-mysql-session';
import * as es from 'express-session';

import { debug, esiCache } from '../index';
import { RequestLogger } from '../loggers/request.logger';
import { APIRouter } from '../routers/api.router';
import { BaseRouter } from '../routers/base.router';
import { DataRouter } from '../routers/data.router';
import { ErrorRouter } from '../routers/error.router';
import { GlobalRouter } from '../routers/global.router';
import { SSORouter } from '../routers/sso.router';
import { UserRouter } from '../routers/user.router';

import { DatabaseConnection, db } from './database.controller';
import { SocketServer } from './socket.controller';

export class Application {

    public sessionStore?: MySQLStore.MySQLStore;
    public sessionParser?: express.RequestHandler;

    private webServer?: WebServer;
    private socketServer?: SocketServer;

    private static exit(exitCode: number) {
        debug('Shutting down');
        process.exit(exitCode);
    }

    public async start(): Promise<void> {

        debug('Creating database connection');
        await new DatabaseConnection().connect();

        debug('Beginning Express startup');

        const expressApplication = express();
        debug('Express application constructed');

        expressApplication.use(Sentry.Handlers.requestHandler());

        // Request logger
        expressApplication.use(RequestLogger.logRequest());

        // Security options
        expressApplication.use(cors({
            credentials: true,
            origin: 'http://192.168.2.11:8100',
        }));
        const trustProxySetting = process.env.EVIE_PROXY_SETTING !== undefined ? process.env.EVIE_PROXY_SETTING : 1;
        expressApplication.set('trust proxy', trustProxySetting);

        // Setup bodyParser
        expressApplication.use(bodyParser.json() as any);
        expressApplication.use(bodyParser.urlencoded({ extended: true }) as any);

        expressApplication.use(compression());

        // Setup MySQL Session Storage
        const store = MySQLStore(es);
        this.sessionStore = new store({
            schema: {
                columnNames: {
                    data: 'data',
                    expires: 'expires',
                    session_id: 'session_id',
                },
                tableName: 'session',
            },
        }, db.pool);

        // Configure Session Parser
        const secureCookies = process.env.EVIE_SESSION_SECURE ? process.env.EVIE_SESSION_SECURE.toLowerCase() === 'true' : true;
        this.sessionParser = es({
            cookie: {
                httpOnly: true,
                maxAge: 6 * 60 * 60 * 1000, // 6 hours
                secure: secureCookies,
            },
            name: process.env.EVIE_SESSION_KEY,
            proxy: true,
            resave: false,
            rolling: true,
            saveUninitialized: true,
            secret: process.env.EVIE_SESSION_SECRET as string,
            store: process.env.NODE_ENV === 'production' ? this.sessionStore : undefined,
        });

        expressApplication.use(this.sessionParser);

        debug('Express session store loaded');

        // Use static client folder for serving assets
        expressApplication.use(express.static(path.join(appRoot.toString(), '../client/dist/client/')));

        // Global router.
        expressApplication.use('*', new GlobalRouter().router);

        // Application routers.
        expressApplication.use('/api', new APIRouter().router);
        expressApplication.use(/\/api\/users?/, new UserRouter().router);
        expressApplication.use('/sso', new SSORouter().router);
        expressApplication.use('/data', new DataRouter().router);
        expressApplication.use('*', (_request: express.Request, response: express.Response) => BaseRouter.send404(response));

        expressApplication.use(Sentry.Handlers.errorHandler());

        // Error router.
        expressApplication.use(ErrorRouter.errorRoute);

        debug('Express configuration set');
        debug('App startup done');

        const serverPort = process.env.EVIE_SERVER_PORT;
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
        process.on('unhandledRejection', (): void => {
            Application.exit(exitCode);
        });

        let quitMessage = 'Quitting';
        if (error) {
            quitMessage += ' because of an uncaught exception!';
            process.stderr.write(`Reason: ${error}\n`);
        }
        process.emitWarning(quitMessage);

        debug('Dumping cache to files');
        esiCache.dumpCache();

        if (this.socketServer) {
            if (process.env.NODE_ENV === 'production') {
                this.socketServer.io.emit('STOP');
            }
            this.socketServer.io.close();
        }

        if (db && db.orm) {
            await db.orm.close();
            debug('ORM connection closed');
        }

        await new Promise((resolve) => {
            if (db && db.pool) {
                db.pool.end(() => {
                    debug('DB pool closed');
                    resolve(undefined);
                });
            } else {
                resolve(undefined);
            }
        });

        Application.exit(exitCode);
    }
}
