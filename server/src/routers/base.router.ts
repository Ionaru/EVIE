import { NextFunction, Request, Response, Router } from 'express';
import { PathParams, RequestHandler, RequestHandlerParams } from 'express-serve-static-core';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';
import { User } from '../models/user.model';

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

    public static sendSuccessResponse(response: Response, data?: any): Response {
        return BaseRouter.sendResponse(response, httpStatus.OK, 'OK', data);
    }

    public static send404(response: Response): Response {
        return BaseRouter.sendResponse(response, httpStatus.NOT_FOUND, 'Not Found');
    }

    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    public static async checkAdmin(request: Request, response: Response, nextFunction: any) {
        const user: User | undefined = await User.doQuery()
            .select(['user.isAdmin'])
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();
        if (!user || !user.isAdmin) {
            BaseRouter.sendResponse(response, httpStatus.FORBIDDEN, 'NoPermissions');
            return;
        }
        return nextFunction;
    }

    public static checkLogin(request: Request, response: Response, nextFunction: any) {
        if (!request.session!.user.id) {
            BaseRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
            return;
        }
        return nextFunction;
    }

    public static checkBodyParameters(request: Request, response: Response, _nextFunction: any, _params: string[]) {
        // const missingParameters = Object.keys(request.body).filter((param) => !_params.includes(param));
        const missingParameters = _params.filter((param) => !Object.keys(request.body).includes(param));
        console.log(missingParameters);
        if (missingParameters.length) {
            BaseRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters', missingParameters);
            return;
        }
        return _nextFunction;
    }

    public static requestDecorator(func: (x: Request, y: Response, z: any, a?: any) => any, ...extraArgs: any[]) {
        return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
            const originalFunction = descriptor.value;

            descriptor.value = async function(...args: any[]) {
                const nextFunction = await func(args[0], args[1], originalFunction, extraArgs);
                if (nextFunction) {
                    return nextFunction.apply(this, args);
                }
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
