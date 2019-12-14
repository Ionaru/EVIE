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

type Method = 'post' | 'put' | 'get' | 'delete' | 'all';

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
    public static async checkAdmin(request: Request, response: Response, nextFunction: NextFunction) {
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

    public static checkAuthorizedClient(request: Request, response: Response, nextFunction: NextFunction) {

        if (process.env.NODE_ENV !== 'production') {
            // Allow all clients when running in debug mode, useful for working with Postman to test the API.
            return nextFunction;
        }

        const requestOrigin = request.headers.origin;
        const isAllowed = BaseRouter.allowedHosts.some((host) => requestOrigin && requestOrigin.includes(host));

        if (!isAllowed) {
            process.emitWarning(`Unknown host tried to connect, possible CORS: ${requestOrigin}`);
            BaseRouter.sendResponse(response, httpStatus.FORBIDDEN, 'BadHost');
            return;
        }

        const serverToken = request.session!.token as unknown;
        const clientToken = request.headers['x-evie-token'] as unknown;

        // Only allow requests from a logged-in user, or with a valid and matching token.
        if (!serverToken || !clientToken || serverToken !== clientToken) {
            process.emitWarning(`Unauthorized client: ${clientToken}, expected: ${serverToken}`);
            BaseRouter.sendResponse(response, httpStatus.FORBIDDEN, 'BadClient');
            return;
        }

        return nextFunction;
    }

    @BaseRouter.requestDecorator(BaseRouter.checkAuthorizedClient)
    public static checkLogin(request: Request, response: Response, nextFunction: any) {
        if (!request.session!.user.id) {
            BaseRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
            return;
        }
        return nextFunction;
    }

    public static checkBodyParameters(request: Request, response: Response, nextFunction: NextFunction, params: string[]) {
        const missingParameters = params.filter((param) => !Object.keys(request.body).includes(param));
        if (missingParameters.length) {
            BaseRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters', missingParameters);
            return;
        }
        return nextFunction;
    }

    public static checkQueryParameters(request: Request, response: Response, nextFunction: NextFunction, params: string[]) {
        const missingParameters = params.filter((param) => !Object.keys(request.query).includes(param));
        if (missingParameters.length) {
            BaseRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'MissingParameters', missingParameters);
            return;
        }
        return nextFunction;
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

    protected static debug = debug.extend('router');

    private static allowedHosts = [
        'localhost', '0.0.0.0', '192.168.2.11', 'spaceships.app',
    ];

    public router = Router();

    constructor() {
        BaseRouter.debug(`New express router: ${this.constructor.name}`);
    }

    public createRoute(method: Method, url: PathParams, routeFunction: RequestHandler | RequestHandlerParams): void {
        BaseRouter.debug(`New route: ${method.toUpperCase()} ${url}`);
        this.router[method](url, this.asyncHandler(routeFunction));
    }

    private asyncHandler(routeFunction: any): any {
        return (request: Request, response: IResponse, next: NextFunction) => {
            if (!response.route) {
                response.route = [];
            }
            response.route.push(`${this.constructor.name}:${routeFunction.name}`);
            Promise.resolve(routeFunction(request, response, next)).catch(next);
        };
    }
}
