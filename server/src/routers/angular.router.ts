import * as appRoot from 'app-root-path';
import { Request, Response } from 'express';
import * as path from 'path';

import { BaseRouter } from './base.router';

export class AngularRedirectRouter extends BaseRouter {

    // noinspection JSUnusedLocalSymbols
    private static async redirectToAngular(_request: Request, response: Response): Promise<void> {

        response.sendFile(path.join(appRoot.toString(), '../client/dist/client/index.html'));
    }

    constructor() {
        super();
        this.createAllRoute('/', AngularRedirectRouter.redirectToAngular);
    }
}
