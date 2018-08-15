import { NextFunction, Request, Response, Router } from 'express';
import { PathParams, RequestHandler, RequestHandlerParams } from 'express-serve-static-core';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

export class BaseRouter {

    public static sendResponse(response: Response, statusCode: number, message: string, data?: object): Response {
        let state = 'success';
        if (statusCode !== httpStatus.OK) {
            state = 'error';
        }

        const responseData = {
            data,
            message,
            state,
        };

        if (!data) {
            delete responseData.data;
        }
        response.status(statusCode);
        return response.json(responseData);
    }

    public router = Router();

    constructor() {
        logger.info(`New express router: ${this.constructor.name}`);
    }

    public createAllRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams, secure = false): void {
        this.router.all(url, this.asyncHandler(secure ? this.authHandler(routeFunction) : routeFunction));
    }

    public createGetRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams, secure = false): void {
        this.router.get(url, this.asyncHandler(secure ? this.authHandler(routeFunction) : routeFunction));
    }

    public createPostRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams, secure = false): void {
        this.router.post(url, this.asyncHandler(secure ? this.authHandler(routeFunction) : routeFunction));
    }

    public createPutRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams, secure = false): void {
        this.router.put(url, this.asyncHandler(secure ? this.authHandler(routeFunction) : routeFunction));
    }

    public createDeleteRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams, secure = false): void {
        this.router.delete(url, this.asyncHandler(secure ? this.authHandler(routeFunction) : routeFunction));
    }

    private asyncHandler(routeFunction: any): any {
        return (request: Request, response: Response, next: NextFunction) => {
            Promise.resolve(routeFunction(request, response, next)).catch(next);
        };
    }

    private authHandler(routeFunction: any): any {
        return (request: Request, response: Response, next: NextFunction) => {
            if (!request.session!.user.id) {
                // No user ID present in the session.
                return BaseRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
            }
            return Promise.resolve(routeFunction(request, response, next)).catch(next);
        };
    }
}
