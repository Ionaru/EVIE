import { Router, Response, Request } from 'express';
import { RequestHandlerParams } from 'express-serve-static-core';
import { logger } from '../services/logger.service';

interface RequestLogItem {
  id;
  request: Request;
}
export let requestList: Array<RequestLogItem> = [];

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

  const request = requestList.filter(_ => _.id === response['id'])[0].request;

  const responseData = {
    state: state,
    message: message,
    data: data,
  };

  if (!data) {
    delete responseData.data;
  }

  logger.debug(`${getIp(request)} -> ${request.originalUrl} -> ${statusCode} ${message}`);

  response.status(statusCode);
  response.type('html');
  response.json(responseData);
}

export function sendTextResponse(response: Response, statusCode: number, message: string): void {
  const request = requestList.filter(_ => _.id === response['id'])[0].request;

  logger.debug(`${getIp(request)} -> ${request.originalUrl} -> ${statusCode}`);

  response.status(statusCode);
  response.send(message);
}

export function getIp(request: Request): string {
  return request.headers['x-forwarded-for'] ||
    request.connection.remoteAddress ||
    request.socket.remoteAddress;
}
