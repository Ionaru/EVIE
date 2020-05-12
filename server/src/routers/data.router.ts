import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';

import { DataController } from '../controllers/data.controller';

import { BaseRouter } from './base.router';

export class DataRouter extends BaseRouter {

    public constructor() {
        super();
        this.createRoute('post', '/types', DataRouter.getTypes);
        this.createRoute('get', '/skill-types', DataRouter.getSkillTypes);
        this.createRoute('get', '/skill-ids', DataRouter.getSkillIds);
        this.createRoute('get', '/market-types', DataRouter.getMarketTypes);
        this.createRoute('get', '/market-ids', DataRouter.getMarketIds);
        this.createRoute('get', '/manufacturing/:id', DataRouter.getManufacturingInfo);
        this.createRoute('get', '/estimated-item-value/:id', DataRouter.getEstimatedItemValue);
        this.createRoute('get', '/refining/:id', DataRouter.getRefiningProducts);
        this.createRoute('get', '/industry/system/:id', DataRouter.getIndustrySystem);
        this.createRoute('get', '/pi', DataRouter.getPIInfo);
        this.createRoute('get', '/pi/:id', DataRouter.getPISchematic);
    }

    private static getTypeId(request: Request) {
        if (!request.params || Array.isArray(request.params) || !request.params.id) {
            return;
        }

        return Number(request.params.id);
    }

    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getEstimatedItemValue(request: Request, response: Response): Promise<Response> {
        const typeId = DataRouter.getTypeId(request);

        if (!typeId) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'NoParam');
        }

        if (isNaN(typeId)) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidParam');
        }

        const data = await DataController.getEstimatedItemValue(typeId);

        if (!data) {
            return DataRouter.sendResponse(response, httpStatus.NOT_FOUND, 'NotFound');
        }

        return DataRouter.sendSuccessResponse(response, data);
    }

    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getManufacturingInfo(request: Request, response: Response): Promise<Response> {
        const typeId = DataRouter.getTypeId(request);

        if (!typeId) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'NoParam');
        }

        if (isNaN(typeId)) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidParam');
        }

        const data = await DataController.getManufacturingInfo(typeId);

        if (!data) {
            return DataRouter.sendResponse(response, httpStatus.NO_CONTENT, 'OK');
        }

        return DataRouter.sendSuccessResponse(response, data);
    }

    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getRefiningProducts(request: Request, response: Response): Promise<Response> {
        const typeId = DataRouter.getTypeId(request);

        if (!typeId) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'NoParam');
        }

        if (isNaN(typeId)) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidParam');
        }

        const data = await DataController.getRefiningProducts(typeId);

        if (!data) {
            return DataRouter.sendResponse(response, httpStatus.NO_CONTENT, 'OK');
        }

        return DataRouter.sendSuccessResponse(response, data);
    }

    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getPISchematic(request: Request, response: Response): Promise<Response> {
        const typeId = DataRouter.getTypeId(request);

        if (!typeId) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'NoParam');
        }

        if (isNaN(typeId)) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidParam');
        }

        const data = await DataController.getPISchematic(typeId);

        if (!data) {
            return DataRouter.sendResponse(response, httpStatus.NOT_FOUND, 'NotFound');
        }

        return DataRouter.sendSuccessResponse(response, data);
    }

    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getPIInfo(_request: Request, response: Response): Promise<Response> {

        const piInfo = await DataController.getPIInfo();
        return DataRouter.sendSuccessResponse(response, piInfo);
    }

    // noinspection JSUnusedLocalSymbols
    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getSkillTypes(_request: Request, response: Response): Promise<Response> {

        const skills = await DataController.getSkillTypes();
        return DataRouter.sendSuccessResponse(response, skills);
    }

    // noinspection JSUnusedLocalSymbols
    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getSkillIds(_request: Request, response: Response): Promise<Response> {

        const skills = await DataController.getSkillIds();
        return DataRouter.sendSuccessResponse(response, skills);
    }

    // noinspection JSUnusedLocalSymbols
    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getMarketIds(_request: Request, response: Response): Promise<Response> {

        const marketIds = await DataController.getMarketIds();
        return DataRouter.sendSuccessResponse(response, marketIds);
    }

    // noinspection JSUnusedLocalSymbols
    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getMarketTypes(_request: Request, response: Response): Promise<Response> {

        const marketTypes = await DataController.getMarketTypes();
        return DataRouter.sendSuccessResponse(response, marketTypes);
    }

    // noinspection JSUnusedLocalSymbols
    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getIndustrySystem(request: Request, response: Response): Promise<Response> {
        const systemId = DataRouter.getTypeId(request);

        if (!systemId) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'NoParam');
        }

        if (isNaN(systemId)) {
            return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidParam');
        }

        const industrySystem = await DataController.getIndustrySystem(systemId);

        if (!industrySystem) {
            return DataRouter.send404(response);
        }

        return DataRouter.sendSuccessResponse(response, industrySystem);
    }

    @DataRouter.requestDecorator(DataRouter.checkAuthorizedClient)
    private static async getTypes(request: Request, response: Response): Promise<Response> {

        const typeIds = request.body;

        // Check if request body contains an array with only positive numbers.
        if (typeIds instanceof Array) {
            const invalidTypeIds = typeIds.filter((item) => typeof item !== 'number' || item <= 0);
            if (invalidTypeIds.length) {
                return DataRouter.sendResponse(response, httpStatus.BAD_REQUEST, 'InvalidElements', invalidTypeIds);
            }
        }

        const types = await DataController.getUniverseTypes(...typeIds);

        return DataRouter.sendSuccessResponse(response, types);
    }
}
