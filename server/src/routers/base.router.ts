import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { PathParams, RequestHandlerParams } from 'express-serve-static-core';
import * as httpStatus from 'http-status-codes';

import { debug } from '../index';
import { User } from '../models/user.model';

export interface IServerResponse<T> {
    state: string;
    message: string;
    data?: T;
}

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

    public static checkAuthorizedClient(request: Request, response: Response, nextFunction: any) {

        if (process.env.NODE_ENV !== 'production') {
            // Allow all clients when running in debug mode, useful for working with Postman to test the API.
            return nextFunction;
        }

        const requestOrigin = request.headers.origin;
        const allowedHosts = BaseRouter.allowedHosts.filter((host) => requestOrigin && requestOrigin.includes(host));

        if (!allowedHosts.length) {
            process.emitWarning(`Unknown host tried to connect, possible CORS: ${requestOrigin}`);
            BaseRouter.sendResponse(response, httpStatus.FORBIDDEN, 'BadHost');
            return;
        }

        const serverToken = request.session!.token;
        const clientToken = request.headers['x-evie-token'];

        // Only allow requests from a logged-in user, or with a valid and matching token.
        if (!request.session!.user.id && (!serverToken || !clientToken || serverToken !== clientToken)) {
            process.emitWarning(`Unauthorized client: ${clientToken}, expected: ${serverToken}`);
            BaseRouter.sendResponse(response, httpStatus.FORBIDDEN, 'BadClient');
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

    private static allowedHosts = [
        'localhost', '0.0.0.0', '192.168.2.11', 'spaceships.app',
    ];

    private static debug = debug.extend('router');

    public router = Router();

    constructor() {
        BaseRouter.debug(`New express router: ${this.constructor.name}`);
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
