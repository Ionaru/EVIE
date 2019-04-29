import { Configurator } from '@ionaru/configurator';
import { CacheController, PublicESIService } from '@ionaru/esi-service';
import { HttpsAgent } from 'agentkeepalive';
import axios, { AxiosInstance } from 'axios';
import 'reflect-metadata'; // Required by TypeORM.
import * as sourceMapSupport from 'source-map-support';
import { WinstonPnPLogger } from 'winston-pnp-logger';

import { Application } from './controllers/application.controller';

export let configPath = 'config';
export let config: Configurator;
export let esiService: PublicESIService;
export let esiCache: CacheController;
export let axiosInstance: AxiosInstance;

(function start() {
    sourceMapSupport.install();

    const logger = new WinstonPnPLogger({
        announceSelf: false,
        logDir: 'logs',
        showMilliSeconds: true,
    });

    config = new Configurator(configPath);
    config.addConfigFiles('main', 'database', 'sso');

    axiosInstance = axios.create({
        // 60 sec timeout
        timeout: 60000,

        // keepAlive pools and reuses TCP connections, so it's faster
        httpsAgent: new HttpsAgent(),

        // follow up to 10 HTTP 3xx redirects
        maxRedirects: 10,

        // cap the maximum content length we'll accept to 50MBs, just in case
        maxContentLength: 50 * 1000 * 1000,
    });

    esiCache = new CacheController('data/responseCache.json');
    esiService = new PublicESIService({axiosInstance, cacheController: esiCache});

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
    process.on('unhandledRejection', (reason, p): void => {
        logger.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    });

    application.start().then().catch((error: Error) => application.stop(error));
})();
