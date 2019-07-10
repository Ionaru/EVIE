import chalk, { Chalk, ColorSupport } from 'chalk';
import { NextFunction, Request, Response } from 'express';
import * as onFinished from 'on-finished';

import { debug } from '../index';
import { IResponse } from '../routers/base.router';

export class RequestLogger {
    public static ignoredUrls = ['/modules', '/images', '/fonts', '/stylesheets', '/scripts', '/favicon.ico'];
    public static ignoredExtension = ['.ico', '.js', '.css', '.png', '.jpg', '.svg', '.html'];
    public static arrow = chalk.white('->');

    // tslint:disable-next-line:cognitive-complexity
    public static logRequest(): any {
        return function log(request: Request, response: Response, next: NextFunction) {

            const requestStartTime = Date.now();

            // Runs when the request has finished.
            onFinished(response, async (_err, endResponse: IResponse) => {

                const ignoredUrlMatch = RequestLogger.ignoredUrls.some(
                    (ignoredUrl) => request.originalUrl.startsWith(ignoredUrl));

                const ignoredExtensionMatch = RequestLogger.ignoredExtension.some(
                    (ignoredExtension) => request.originalUrl.endsWith(ignoredExtension));

                // Do not log requests to static URLs and files unless their status code is not OK.
                if ((!ignoredExtensionMatch && !ignoredUrlMatch) || (endResponse.statusCode !== 200 && endResponse.statusCode !== 304)) {

                    const message = endResponse.data ? endResponse.data.message : undefined;

                    const statusColor = RequestLogger.getStatusColor(endResponse.statusCode);
                    const status = statusColor(`${endResponse.statusCode} ${endResponse.statusMessage}`);

                    const route = endResponse.route;
                    const router = chalk.white(route && route.length ? route.join(' > ') : 'ServeStatic');

                    const ip = RequestLogger.getIp(request);
                    const identifier = `${ip} (${chalk.white(request.sessionID!)})`;

                    const text = `${request.method} ${request.originalUrl}`;

                    const requestDuration = Date.now() - requestStartTime;
                    const arrow = RequestLogger.arrow;

                    let logContent = `${identifier}: ${text} ${arrow} ${router} ${arrow} `;
                    if (message) {
                        logContent += `${message} `;
                    }
                    logContent += `${status}, ${requestDuration}ms`;

                    if (endResponse.statusCode >= 500) {
                        process.stderr.write(logContent + '\n');
                    } else if (endResponse.statusCode >= 400) {
                        process.emitWarning(logContent);
                    } else {
                        RequestLogger.debug(logContent);
                    }
                }
            });
            next();
        };
    }

    public static getStatusColor(statusCode: number): Chalk & { supportsColor: ColorSupport } {
        if (statusCode >= 500) {
            return chalk.red;
        } else if (statusCode >= 400) {
            return chalk.yellow;
        } else if (statusCode >= 300) {
            return chalk.cyan;
        } else if (statusCode >= 200) {
            return chalk.green;
        } else {
            return chalk.whiteBright;
        }
    }

    private static debug = debug.extend('request');

    private static getIp(request: Request) {

        const ip = request.headers['x-forwarded-for'] ||
            request.connection.remoteAddress ||
            request.socket.remoteAddress ||
            request.ip ||
            'Unknown IP';

        // make IPv6 readable.
        return (typeof ip === 'string' && ip.substr(0, 7) === '::ffff:') ? ip.substr(7) : ip;
    }
}
