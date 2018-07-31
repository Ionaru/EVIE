import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';

import { DataController } from '../controllers/data.controller';
import { BaseRouter } from './base.router';

export class DataRouter extends BaseRouter {

    private static async getSkillTypes(request: Request, response: Response): Promise<Response> {
        if (!request.session || !request.session.user.id) {
            // No user ID present in the session.
            return DataRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
        }

        const skills = await DataController.getSkillTypes();

        return DataRouter.sendResponse(response, httpStatus.OK, 'OK', skills);
    }

    private static async getTypes(request: Request, response: Response): Promise<Response> {
        if (!request.session || !request.session.user.id) {
            // No user ID present in the session.
            return DataRouter.sendResponse(response, httpStatus.UNAUTHORIZED, 'NotLoggedIn');
        }

        const typeIds = request.body;

        // Check if request body contains an array with only numbers.
        if (typeIds instanceof Array) {
            for (const item of typeIds) {
                if (typeof item !== 'number') {
                    return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidElements');
                }
            }
        }

        const skills = await DataController.getSkillTypes();

        return DataRouter.sendResponse(response, httpStatus.OK, 'OK', skills);
    }

    constructor() {
        super();
        this.createPostRoute('/types', DataRouter.getTypes);
        this.createGetRoute('/skill-types', DataRouter.getSkillTypes);
    }
}
