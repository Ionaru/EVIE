import chalk, { Chalk, ColorSupport } from 'chalk';
import { NextFunction, Request, Response } from 'express';
import * as onFinished from 'on-finished';
import { logger } from 'winston-pnp-logger';

export class RequestLogger {
    public static ignoredUrls = ['/modules', '/images', '/fonts', '/stylesheets', '/scripts', '/favicon.ico'];
    public static arrow = chalk.white('->');

    public static logRequest(): any {
        return function log(request: Request, response: Response, next: NextFunction) {

            const requestStartTime = Date.now();

            // Runs when the request has finished.
            onFinished(response, async (_err, endResponse: Response) => {

                const ignoredMatch = RequestLogger.ignoredUrls.filter(
                    (ignoredEntry) => request.originalUrl.startsWith(ignoredEntry)).length;

                if (!ignoredMatch || (endResponse.statusCode !== 200 && endResponse.statusCode !== 304)) {

                    const statusColor = RequestLogger.getStatusColor(endResponse.statusCode);
                    const status = statusColor(`${endResponse.statusCode} ${endResponse.statusMessage}`);

                    const ip = RequestLogger.getIp(request);

                    const requestText = `${request.method} ${request.originalUrl}`;

                    const requestDuration = Date.now() - requestStartTime;
                    const logContent = `${ip} ${RequestLogger.arrow} ${requestText} ${RequestLogger.arrow} ${status}, ${requestDuration}ms`;
                    if (endResponse.statusCode >= 500) {
                        logger.error(logContent);
                    } else if (endResponse.statusCode >= 400) {
                        logger.warn(logContent);
                    } else {
                        logger.debug(logContent);
                    }
                }
            });
            next();
        };
    }

    private static getIp(request: Request) {
        return request.ip ||
            request.headers['x-forwarded-for'] ||
            request.connection.remoteAddress ||
            request.socket.remoteAddress ||
            'Unknown IP';
    }

    private static getStatusColor(statusCode: number): Chalk & { supportsColor: ColorSupport } {
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
}
