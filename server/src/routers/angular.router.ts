import { Request, Response } from 'express';
import path = require('path');

import { BaseRouter } from './base.router';

export class AngularRedirectRouter extends BaseRouter {

    private static async redirectToAngular(_request: Request, response: Response): Promise<void> {
        response.sendFile(path.join(__dirname, '../../../clientv2/dist/index.html'));
    }

    constructor() {
        super();
        this.createAllRoute('/', AngularRedirectRouter.redirectToAngular);
    }
}
