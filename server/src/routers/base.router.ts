import { NextFunction, Request, Response, Router } from 'express';
import { RequestHandlerParams } from 'express-serve-static-core';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

export interface IResponse extends Response {
    id?: string;
}

interface IRequestLogItem {
    id: string;
    request: Request;
}

export let requestList: IRequestLogItem[] = [];

export class BaseRouter {
    public router: Router = Router();

    public createAllRoute(url: string, routeFunction: RequestHandlerParams): void {
        this.router.all(url, wrapper(routeFunction));
    }

    public createGetRoute(url: string, routeFunction: RequestHandlerParams): void {
        this.router.get(url, wrapper(routeFunction));
    }

    public createPostRoute(url: string, routeFunction: RequestHandlerParams): void {
        this.router.post(url, wrapper(routeFunction));
    }

    public createPutRoute(url: string, routeFunction: RequestHandlerParams): void {
        this.router.put(url, wrapper(routeFunction));
    }

    public createDeleteRoute(url: string, routeFunction: RequestHandlerParams): void {
        this.router.delete(url, wrapper(routeFunction));
    }
}

function wrapper(routeFunction: any) {
    return (request: Request, response: Response, next?: NextFunction) => {
        if (routeFunction) {
            routeFunction(request, response, next).catch((err: Error) => {
                errorHandler(err, request, response);
            });
        }
    };
}

export function sendResponse(response: IResponse, statusCode: number, message: string, data?: object): void {
    let state = 'success';
    if (statusCode !== 200) {
        state = 'error';
    }

    const request = requestList.filter((_) => _.id === response.id)[0].request;

    const responseData = {
        data,
        message,
        state,
    };

    if (!data) {
        delete responseData.data;
    }
    response.status(statusCode);
    // noinspection JSIgnoredPromiseFromCall
    response.json(responseData);

    logRequest(request, response, message);
}

export function sendTextResponse(response: IResponse, statusCode: number, message: string): void {
    response.status(statusCode);
    response.send(message);

    const request = requestList.filter((_) => _.id === response.id)[0].request;
    logRequest(request, response, message);
}

function logRequest(request: Request, response: Response, message?: string) {
    logger.debug(`${getIp(request)} -> ${request.originalUrl} -> ${response.statusCode} ${message}`);
}

export function getIp(request: Request): string {
    return request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress || 'Unknown IP';
}

export function errorHandler(error: Error, _req: Request, response: Response) {
    logger.error(error.message, error);
    sendTextResponse(response, httpStatus.INTERNAL_SERVER_ERROR, error.message);
}
