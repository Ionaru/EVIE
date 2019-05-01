import { NextFunction, Request } from 'express';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { BaseRouter, IResponse } from './base.router';

export class ErrorRouter extends BaseRouter {

    // noinspection JSUnusedLocalSymbols
    /**
     * Handle errors thrown in requests, show or hide the stacktrace in the response depending on the environment.
     */
    public static errorRoute(error: Error, request: Request, response: IResponse, _next: NextFunction): void {
        response.route!.push('ErrorRouter');
        response.status(httpStatus.INTERNAL_SERVER_ERROR);
        logger.error(`Error on ${request.method} ${request.originalUrl} -> ${error.stack}`);
        const errorDetails = process.env.NODE_ENV === 'production' ? undefined : {error: error.stack};
        ErrorRouter.sendResponse(response, httpStatus.INTERNAL_SERVER_ERROR, 'InternalServerError', errorDetails);
    }
}
