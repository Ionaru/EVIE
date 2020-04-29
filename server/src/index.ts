// Create and export the debug instance so imported files can create extensions of it.
// eslint-disable-next-line import/order
import Debug from 'debug';
export const debug = Debug('evie');

import { CacheController, IDefaultExpireTimes, PublicESIService } from '@ionaru/esi-service';
import { EVE } from '@ionaru/eve-utils';
import * as Sentry from '@sentry/node';
import { HttpsAgent } from 'agentkeepalive';
import axios, { AxiosInstance } from 'axios';
import 'reflect-metadata'; // Required by TypeORM.
import * as sourceMapSupport from 'source-map-support';

import { version } from '../package.json';

import { Application } from './controllers/application.controller';

export let esiService: PublicESIService;
export let esiCache: CacheController;
export let axiosInstance: AxiosInstance;

const start = () => {
    sourceMapSupport.install();

    debug(`Initializing Sentry (enabled: ${process.env.NODE_ENV === 'production'})`);
    Sentry.init({
        debug: process.env.NODE_ENV !== 'production',
        dsn: 'https://4064eff091454347b283cc8b939a99a0@sentry.io/1318977',
        enabled: process.env.NODE_ENV === 'production',
        release: `evie-server@${version}`,
    });

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
    const defaultExpireTimes: IDefaultExpireTimes = {};
    defaultExpireTimes[EVE.SDEURL] = 7200000; // 2 hours
    esiCache = new CacheController('data/responseCache.json', defaultExpireTimes);

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
        debug('SIGINT received');
        application.stop().then();
    });
    process.on('SIGTERM', () => {
        debug('SIGTERM received');
        application.stop().then();
    });
    // Promises that fail should not cause the application to stop, instead we log the error.
    process.on('unhandledRejection', (reason, p): void => {
        Sentry.captureMessage(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`, Sentry.Severity.Error);
    });

    application.start().then().catch((error: Error) => application.stop(error));
};

if (require.main === module) {
    start();
}
