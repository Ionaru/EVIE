import { Router } from 'express';
import { RequestHandlerParams } from 'express-serve-static-core';

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
