import { NextFunction, Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { BaseRouter } from './base.router';

export class ErrorRouter extends BaseRouter {

    /**
     * Handle errors thrown in requests, show or hide the stacktrace in the response depending on the environment.
     */
    public static errorRoute(error: Error, request: Request, response: Response, _next: NextFunction): void {
        response.status(httpStatus.INTERNAL_SERVER_ERROR);
        logger.error(`Error on ${request.method} ${request.originalUrl} -> ${error.stack}`);
        const errorDetails = process.env.NODE_ENV === 'production' ? {error: error.stack} : undefined;
        ErrorRouter.sendResponse(response, httpStatus.INTERNAL_SERVER_ERROR, 'InternalServerError', errorDetails);
    }
}
