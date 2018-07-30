import { NextFunction, Request, Response, Router } from 'express';
import { PathParams, RequestHandler, RequestHandlerParams } from 'express-serve-static-core';
import { logger } from 'winston-pnp-logger';

export class BaseRouter {

    public static sendResponse(response: Response, statusCode: number, message: string, data?: object): Response {
        let state = 'success';
        if (statusCode !== 200) {
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
        return (request: Request, response: Response, next: NextFunction) => {
            Promise.resolve(routeFunction(request, response, next)).catch(next);
        };
    }
}
