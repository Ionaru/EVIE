import { NextFunction, Request, Response } from 'express';
import { logger } from 'winston-pnp-logger';
import { BaseRouter } from './base.router';

export class ErrorRouter extends BaseRouter {

    /**
     * Handle errors thrown in requests, show or hide the stacktrace depending on the environment.
     */
    public static errorRoute(error: Error, request: Request, response: Response, _next: NextFunction): void {
        response.status(500);
        logger.error(`Error on ${request.method} ${request.originalUrl} -> ${error.stack}`);
        const errorDetails = process.env.NODE_ENV === 'production' ? {error: error.stack} : undefined;
        ErrorRouter.sendResponse(response, 500, 'InternalServerError', errorDetails);
    }
}
