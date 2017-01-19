import { Response, Request, NextFunction } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter, requestList } from './base.router';
import { generateRandomString } from '../controllers/pid.service';

export class GlobalRouter extends BaseRouter {

  constructor() {
    super();
    this.createAllRoute('/', GlobalRouter.logRequest);
    logger.info('Route defined: Global');
  }

  private static logRequest(request: Request, response: Response, next: NextFunction): void {

    if (!request.session['user']) {
      request.session['user'] = {};
    }

    let id = generateRandomString(5);
    let log = {
      id: id,
      request: request
    };
    response['id'] = id;
    requestList.push(log);

    next();
  }
}
