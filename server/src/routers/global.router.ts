import { NextFunction, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { generateRandomString } from '../services/pid.service';
import { BaseRouter, requestList } from './base.router';

export interface IResponse extends Response {
  id?: string;
}

export class GlobalRouter extends BaseRouter {

  /**
   * All requests to the server go through this router (except when fetching static files).
   * path: All roads (paths) lead to this router
   * method: Any HTML method
   */
  private static globalRoute(request: Request, response: Response, next: NextFunction): void {

    // Define the session user if it didn't exists already
    if (!request.session.user) {
      request.session.user = {};
    }

    // Log the request
    const id = generateRandomString(5);
    requestList.push({
      id,
      request,
    });

    // Store the log ID in the response, so we can refer to it later when we send the response
    const extendedResponse = response as IResponse;
    extendedResponse.id = id;

    // Continue to the other routes
    next();
  }

  constructor() {
    super();
    this.createAllRoute('/', GlobalRouter.globalRoute);
    logger.info('Route defined: Global');
  }
}
