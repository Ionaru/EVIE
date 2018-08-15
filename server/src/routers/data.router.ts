import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';

import { DataController } from '../controllers/data.controller';
import { BaseRouter } from './base.router';

export class DataRouter extends BaseRouter {

    private static async getManufacturingInfo(request: Request, response: Response): Promise<Response> {
        if (!request.params || !request.params.typeId) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'NoParam');
        }

        const typeId = Number(request.params.typeId);

        if (isNaN(typeId)) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidParam');
        }

        const data = await DataController.getManufacturingInfo(typeId);

        if (!data) {
            return DataRouter.sendResponse(response, httpStatus.NOT_FOUND, 'NoDataFound');
        }

        return DataRouter.sendResponse(response, httpStatus.OK, 'OK', data);
    }

    // noinspection JSUnusedLocalSymbols
    private static async getSkillTypes(_request: Request, response: Response): Promise<Response> {

        const skills = await DataController.getSkillTypes();
        return DataRouter.sendResponse(response, httpStatus.OK, 'OK', skills);
    }

    private static async getTypes(request: Request, response: Response): Promise<Response> {

        const typeIds = request.body;

        // Check if request body contains an array with only positive numbers.
        if (typeIds instanceof Array) {
            if (typeIds.filter((item) => typeof item !== 'number' || item < 0).length) {
                return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidElements');
            }
        }

        const types = await DataController.getUniverseTypes(...typeIds);

        return DataRouter.sendResponse(response, httpStatus.OK, 'OK', types);
    }

    constructor() {
        super();
        this.createPostRoute('/types', DataRouter.getTypes, true);
        this.createGetRoute('/skill-types', DataRouter.getSkillTypes, true);
        this.createGetRoute('/manufacturing/:typeId', DataRouter.getManufacturingInfo, true);
    }
}
