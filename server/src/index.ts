// Create and export the debug instance so imported classes can create extensions of it.
import Debug from 'debug';
export let debug = Debug('evie');

import { Configurator } from '@ionaru/configurator';
import { CacheController, PublicESIService } from '@ionaru/esi-service';
import * as Sentry from '@sentry/node';
import { HttpsAgent } from 'agentkeepalive';
import axios, { AxiosInstance } from 'axios';
import 'reflect-metadata'; // Required by TypeORM.
import * as sourceMapSupport from 'source-map-support';
import { WinstonPnPLogger } from 'winston-pnp-logger';

import { version } from '../package.json';
import { Application } from './controllers/application.controller';

export let configPath = 'config';
export let config: Configurator;
export let esiService: PublicESIService;
export let esiCache: CacheController;
export let axiosInstance: AxiosInstance;

(function start() {
    sourceMapSupport.install();

    debug(`Initializing Sentry (enabled: ${process.env.NODE_ENV === 'production'})`);
    Sentry.init({
        debug: process.env.NODE_ENV !== 'production',
        dsn: 'https://4064eff091454347b283cc8b939a99a0@sentry.io/1318977',
        enabled: process.env.NODE_ENV === 'production',
        release: `evie-server@${version}`,
    });

    new WinstonPnPLogger({
        announceSelf: false,
        logDir: 'logs',
        showMilliSeconds: true,
    });

    debug('Loading configuration');
    config = new Configurator(configPath);
    config.addConfigFiles('main', 'database', 'sso');

    debug('Creating axios instance');
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

    debug('Creating CacheController instance');
    esiCache = new CacheController('data/responseCache.json');

    debug('Creating PublicESIService instance');
    esiService = new PublicESIService({
        axiosInstance,
        cacheController: esiCache,
        onRouteWarning: (route, text) => {
            Sentry.captureMessage(`${text}: ${route}`, Sentry.Severity.Warning);
        },
    });

    debug('Creating Application');
    const application = new Application();

    // Ensure application shuts down gracefully at all times.
    process.stdin.resume();
    process.on('uncaughtException', (error: Error) => {
        Sentry.captureException(error);
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
        Sentry.captureMessage(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`, Sentry.Severity.Error);
    });

    application.start().then().catch((error: Error) => application.stop(error));
})();
