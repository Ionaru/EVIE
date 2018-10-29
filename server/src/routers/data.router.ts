import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';

import { DataController } from '../controllers/data.controller';
import { BaseRouter } from './base.router';

export class DataRouter extends BaseRouter {

    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
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
            return DataRouter.sendResponse(response, httpStatus.NO_CONTENT, 'OK');
        }

        return DataRouter.sendSuccessResponse(response, data);
    }

    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async getReprocessingInfo(request: Request, response: Response): Promise<Response> {
        if (!request.params || !request.params.typeId) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'NoParam');
        }

        const typeId = Number(request.params.typeId);

        if (isNaN(typeId)) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidParam');
        }

        const data = await DataController.getReprocessingProducts(typeId);

        if (!data) {
            return DataRouter.sendResponse(response, httpStatus.NO_CONTENT, 'OK');
        }

        return DataRouter.sendSuccessResponse(response, data);
    }

    // noinspection JSUnusedLocalSymbols
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async getSkillTypes(_request: Request, response: Response): Promise<Response> {

        const skills = await DataController.getSkillTypes();
        return DataRouter.sendSuccessResponse(response, skills);
    }

    // noinspection JSUnusedLocalSymbols
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async getSkillIds(_request: Request, response: Response): Promise<Response> {

        const skills = await DataController.getSkillIds();
        return DataRouter.sendSuccessResponse(response, skills);
    }

    // noinspection JSUnusedLocalSymbols
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async getMarketIds(_request: Request, response: Response): Promise<Response> {

        const marketIds = await DataController.getMarketIds();
        return DataRouter.sendSuccessResponse(response, marketIds);
    }

    // noinspection JSUnusedLocalSymbols
    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async getMarketTypes(_request: Request, response: Response): Promise<Response> {

        const marketTypes = await DataController.getMarketTypes();
        return DataRouter.sendSuccessResponse(response, marketTypes);
    }

    @BaseRouter.requestDecorator(BaseRouter.checkLogin)
    private static async getTypes(request: Request, response: Response): Promise<Response> {

        const typeIds = request.body;

        // Check if request body contains an array with only positive numbers.
        if (typeIds instanceof Array) {
            if (typeIds.filter((item) => typeof item !== 'number' || item <= 0).length) {
                return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidElements');
            }
        }

        const types = await DataController.getUniverseTypes(...typeIds);

        return DataRouter.sendSuccessResponse(response, types);
    }

    constructor() {
        super();
        this.createPostRoute('/types', DataRouter.getTypes);
        this.createGetRoute('/skill-types', DataRouter.getSkillTypes);
        this.createGetRoute('/skill-ids', DataRouter.getSkillIds);
        this.createGetRoute('/market-types', DataRouter.getMarketTypes);
        this.createGetRoute('/market-ids', DataRouter.getMarketIds);
        this.createGetRoute('/manufacturing/:typeId', DataRouter.getManufacturingInfo);
        this.createGetRoute('/reprocessing/:typeId', DataRouter.getReprocessingInfo);
    }
}
