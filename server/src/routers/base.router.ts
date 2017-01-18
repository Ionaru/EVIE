import { Router } from 'express';
import { RequestHandlerParams } from 'express-serve-static-core';
import { Response } from 'express';

export class BaseRouter {
  public router: Router = Router();

  createAllRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.all(url, routeFunction);
  }

  createGetRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.get(url, routeFunction);
  }

  createPostRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.post(url, routeFunction);
  }

  createPutRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.put(url, routeFunction);
  }

  createDeleteRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.delete(url, routeFunction);
  }
}

export function sendResponse(response: Response, statusCode: number, message: string, data?: any): void {
  let state = 'success';
  if (statusCode !== 200) {
    state = 'error';
  }

  let responseData = {
    state: state,
    message: message,
    data: data,
  };

  if (!data) {
    delete responseData.data;
  }

  response.status(statusCode);
  response.json(responseData);
}
