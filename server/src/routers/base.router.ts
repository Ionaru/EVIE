import { Request, Router } from 'express';
import { RequestHandlerParams } from 'express-serve-static-core';
import { logger } from 'winston-pnp-logger';
import { IResponse } from './global.router';

interface IRequestLogItem {
  id;
  request: Request;
}
export let requestList: IRequestLogItem[] = [];

export class BaseRouter {
  public router: Router = Router();

  public createAllRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.all(url, routeFunction);
  }

  public createGetRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.get(url, routeFunction);
  }

  public createPostRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.post(url, routeFunction);
  }

  public createPutRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.put(url, routeFunction);
  }

  public createDeleteRoute(url: string, routeFunction: RequestHandlerParams): void {
    this.router.delete(url, routeFunction);
  }
}

export function sendResponse(response: IResponse, statusCode: number, message: string, data?: any): void {
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

  logger.debug(`${getIp(request)} -> ${request.originalUrl} -> ${statusCode} ${message}`);

  response.status(statusCode);
  response.type('html');
  response.json(responseData);
}

export function sendTextResponse(response: IResponse, statusCode: number, message: string): void {
  const request = requestList.filter((_) => _.id === response.id)[0].request;

  logger.debug(`${getIp(request)} -> ${request.originalUrl} -> ${statusCode}`);

  response.status(statusCode);
  response.send(message);
}

export function getIp(request: Request): string {
  return request.headers['x-forwarded-for'] ||
    request.connection.remoteAddress ||
    request.socket.remoteAddress;
}
