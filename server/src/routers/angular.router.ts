import { Request, Response } from 'express';
import path = require('path');

import { logger } from '../services/logger.service';
import { BaseRouter } from './base.router';

export class AngularRedirectRouter extends BaseRouter {

  private static async redirectToAngular(request: Request, response: Response): Promise<void> {
    response.status(200).sendFile(path.join(__dirname, '../../../client/dist/index.html'));
  }

  constructor() {
    super();
    this.createAllRoute('/', AngularRedirectRouter.redirectToAngular);
    logger.info('Route defined: Angular-Redirect');
  }
}
