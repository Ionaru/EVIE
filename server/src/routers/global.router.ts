import { Response, Request, NextFunction } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter, requestList } from './base.router';
import { generateRandomString } from '../controllers/pid.service';

export class GlobalRouter extends BaseRouter {

  constructor() {
    super();
    this.createAllRoute('/', GlobalRouter.globalRoute);
    logger.info('Route defined: Global');
  }

  /**
   * All requests to the server go through this router (except when fetching static files).
   * path: All roads (paths) lead to this router
   * method: Any HTML method
   */
  private static globalRoute(request: Request, response: Response, next: NextFunction): void {

    // Define the session user if it didn't exists already
    if (!request.session['user']) {
      request.session['user'] = {};
    }

    // Log the request
    const id = generateRandomString(5);
    requestList.push({
      id: id,
      request: request
    });

    // Store the log ID in the response, so we can refer to it later when we send the response
    response['id'] = id;

    // Continue to the other routes
    next();
  }
}
