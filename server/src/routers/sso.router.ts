import { Response, Request } from 'express';
import { logger } from '../controllers/logger.service';
import { BaseRouter } from './base.router';

export class SSORouter extends BaseRouter {

  constructor() {
    super();
    this.createPostRoute('/', SSORouter.startSSOProcess);
    this.createGetRoute('/callback', SSORouter.processCallBack);
    this.createGetRoute('/auth', SSORouter.authorizeToken);
    this.createGetRoute('/renew', SSORouter.renewToken);
    logger.info('Route defined: SSO');
  }

  private static async startSSOProcess(request: Request, response: Response): Promise<void> {
    response.json({});
  }

  private static async processCallBack(request: Request, response: Response): Promise<void> {
    response.json({});
  }

  private static async authorizeToken(request: Request, response: Response): Promise<void> {
    response.json({});
  }

  private static async renewToken(request: Request, response: Response): Promise<void> {
    response.json({});
  }
}
