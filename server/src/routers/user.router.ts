import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';

import { Character } from '../models/character.model';
import { User } from '../models/user.model';

import { BaseRouter } from './base.router';

export class UserRouter extends BaseRouter {

    public constructor() {
        super();
        this.createRoute('get', '/', UserRouter.getUsers);
        this.createRoute('get', '/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', UserRouter.getUser);
        this.createRoute('get', '/:id([0-9])', UserRouter.getUserById);
    }

    @UserRouter.requestDecorator(UserRouter.checkAdmin)
    private static async getUsers(_request: Request, response: Response): Promise<Response> {
        const characters = await Character.doQuery()
            .innerJoinAndSelect('character.user', 'user')
            .orderBy('user.id')
            .getMany();
        return UserRouter.sendSuccessResponse(response, characters);
    }

    @UserRouter.requestDecorator(UserRouter.checkAdmin)
    private static async getUser(request: Request, response: Response): Promise<Response> {
        const user: User | undefined = await User.findOne({uuid: request.params.uuid});

        if (!user) {
            // No user with that username was found
            return UserRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        return UserRouter.sendSuccessResponse(response, user);
    }

    @UserRouter.requestDecorator(UserRouter.checkAdmin)
    private static async getUserById(request: Request, response: Response): Promise<Response> {
        const user: User | undefined = await User.findOne(request.params.id);

        if (!user) {
            // No user with that username was found
            return UserRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        return UserRouter.sendSuccessResponse(response, user);
    }
}
