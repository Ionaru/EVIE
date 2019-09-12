import * as Sentry from '@sentry/node';
import { NextFunction, Request } from 'express';
import * as httpStatus from 'http-status-codes';

import { BaseRouter, IResponse } from './base.router';

export class ErrorRouter extends BaseRouter {

    // noinspection JSUnusedLocalSymbols
    /**
     * Handle errors thrown in requests, show or hide the stacktrace in the response depending on the environment.
     */
    public static errorRoute(error: Error, request: Request, response: IResponse, _next: NextFunction): void {

        response.route!.push('ErrorRouter');
        response.status(httpStatus.INTERNAL_SERVER_ERROR);

        process.stderr.write(`Error on ${request.method} ${request.originalUrl} -> ${error.stack}\n`);
        Sentry.captureException(error);

        const errorDetails = process.env.NODE_ENV === 'production' ? undefined : {error: error.stack};
        ErrorRouter.sendResponse(response, httpStatus.INTERNAL_SERVER_ERROR, 'InternalServerError', errorDetails);
    }
}
