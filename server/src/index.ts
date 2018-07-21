import 'reflect-metadata'; // Required by TypeORM.
import * as sourceMapSupport from 'source-map-support';
import { WinstonPnPLogger } from 'winston-pnp-logger';

import { Application } from './controllers/application.controller';
import { Configurator } from './controllers/configuration.controller';

(function start() {
    sourceMapSupport.install();

    const logger = new WinstonPnPLogger({
        announceSelf: false,
        showMilliSeconds: true,
        // logDir: 'logs',
    });

    const config = new Configurator();
    config.addConfigFile('main');
    config.addConfigFile('database');
    config.addConfigFile('sso');

    const application = new Application();

    // Ensure application shuts down gracefully at all times.
    process.stdin.resume();
    process.on('uncaughtException', (error: Error) => {
        logger.error('Uncaught Exception!', error);
        application.stop(error).then();
    });
    process.on('SIGINT', () => {
        application.stop().then();
    });
    process.on('SIGTERM', () => {
        application.stop().then();
    });
    // Promises that fail should not cause the application to stop, instead we log the error.
    process.on('unhandledRejection', (reason: string, p: Promise<any>): void => {
        logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    });

    application.start().then().catch((error: Error) => application.stop(error));
})();
