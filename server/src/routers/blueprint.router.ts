import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';

import { Character } from '../models/character.model';
import { User } from '../models/user.model';
import { BaseRouter } from './base.router';

export class BlueprintRouter extends BaseRouter {

    @BlueprintRouter.requestDecorator(BlueprintRouter.checkLogin)
    private static async storeBlueprints(request: Request, response: Response): Promise<Response> {

        const blueprintsInput = request.body

        const characters = await Character.doQuery()
            .innerJoinAndSelect('character.user', 'user')
            .orderBy('user.id')
            .getMany();
        return BlueprintRouter.sendSuccessResponse(response, characters);
    }

    constructor() {
        super();
        this.createRoute('post', '/', BlueprintRouter.storeBlueprints);
    }
}
