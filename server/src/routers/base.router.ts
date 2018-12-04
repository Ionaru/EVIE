import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { PathParams, RequestHandlerParams } from 'express-serve-static-core';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { IServerResponse } from '../../../client/src/shared/interface.helper';
import { User } from '../models/user.model';

export interface IResponse extends Response {
    route?: string[];
    data?: IServerResponse<any>;
}

export class BaseRouter {

    public static sendResponse(response: Response, statusCode: number, message: string, data?: any): Response {
        const state = statusCode < 400 ? 'success' : 'error';

        const responseData: IServerResponse<any> = {
            data,
            message,
            state,
        };

        if (!data) {
            delete responseData.data;
        }
        response.status(statusCode);
        (response as IResponse).data = responseData;
        return response.json(responseData);
    }

    public static sendSuccessResponse(response: Response, data?: any): Response {
        return BaseRouter.sendResponse(response, httpStatus.OK, 'OK', data);
    }

    public static send404(response: Response, message = 'Not Found'): Response {
        return BaseRouter.sendResponse(response, httpStatus.NOT_FOUND, message);
    }

    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    public static async checkAdmin(request: Request, response: Response, nextFunction: any) {
        if (process.env.NODE_ENV !== 'production') {
            return nextFunction;
        }

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
        const missingParameters = _params.filter((param) => !Object.keys(request.body).includes(param));
        if (missingParameters.length) {
            BaseRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters', missingParameters);
            return;
        }
        return _nextFunction;
    }

    public static checkQueryParameters(request: Request, response: Response, _nextFunction: any, _params: string[]) {
        const missingParameters = _params.filter((param) => !Object.keys(request.query).includes(param));
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

    public createAllRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams): void {
        this.router.all(url, this.asyncHandler(routeFunction));
    }

    public createGetRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams): void {
        this.router.get(url, this.asyncHandler(routeFunction));
    }

    public createPostRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams): void {
        this.router.post(url, this.asyncHandler(routeFunction));
    }

    public createPutRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams): void {
        this.router.put(url, this.asyncHandler(routeFunction));
    }

    public createDeleteRoute(url: PathParams, routeFunction: RequestHandler | RequestHandlerParams): void {
        this.router.delete(url, this.asyncHandler(routeFunction));
    }

    private asyncHandler(routeFunction: any): any {
        return (request: Request, response: IResponse, next: NextFunction) => {
            if (!response.route) {
                response.route = [];
            }
            response.route.push(this.constructor.name);
            Promise.resolve(routeFunction(request, response, next)).catch(next);
        };
    }
}
