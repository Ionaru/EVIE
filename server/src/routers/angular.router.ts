import { Response, Request } from 'express';
import { logger } from '../services/logger.service';
import path = require('path');
import { BaseRouter } from './base.router';

export class AngularRedirectRouter extends BaseRouter {

  constructor() {
    super();
    this.createAllRoute('/', AngularRedirectRouter.redirectToAngular);
    logger.info('Route defined: Angular-Redirect');
  }

  private static async redirectToAngular(request: Request, response: Response): Promise<void> {
    response.status(200).sendFile(path.join(__dirname, '../../../client/dist/index.html'));
  }
}
