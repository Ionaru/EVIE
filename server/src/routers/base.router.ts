import { NextFunction, Request, Response, Router } from 'express';
import { PathParams, RequestHandler, RequestHandlerParams } from 'express-serve-static-core';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

export class BaseRouter {

    public static sendResponse(response: Response, statusCode: number, message: string, data?: any): Response {
        const state = statusCode === httpStatus.OK ? 'success' : 'error';

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

    public static sendSuccessResponse(response: Response, data?: unknown): Response {
        return BaseRouter.sendResponse(response, httpStatus.OK, 'OK', data);
    }

    public static send404(response: Response): Response {
        return BaseRouter.sendResponse(response, httpStatus.NOT_FOUND, 'Not Found');
    }

    public static loginRequired() {
        return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
            const originalMethod = descriptor.value;

            descriptor.value = function(...args: any[]) {
                const request = args[0] as Request;
                if (!request.session!.user.id) {
                    const response = args[1] as Response;
                    return BaseRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
                }
                return originalMethod.apply(this, args);
            };

            return descriptor;
        };
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
