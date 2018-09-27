import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';

import { User } from '../models/user.model';
import { BaseRouter } from './base.router';

export class UserRouter extends BaseRouter {

    private static async createUser(_request: Request, response: Response): Promise<Response> {
        return BaseRouter.sendResponse(response, 200, 'Moo');
    }

    // @BaseRouter.loginRequired()
    private static async getUsers(_request: Request, response: Response): Promise<Response> {
        const users: User[] = await User.doQuery().getMany();
        return BaseRouter.sendSuccessResponse(response, users);
    }

    private static async getUser(request: Request, response: Response): Promise<Response> {
        const user: User | undefined = await User.doQuery()
            // .select(['user.email', 'user.uuid', 'user.username'])
            // .leftJoinAndSelect('user.characters', 'character')
            .where('user.uuid = :uuid', {uuid: request.params.uuid})
            .getOne();

        if (!user) {
            // No user with that username was found
            return BaseRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
        }

        delete user.id;

        return BaseRouter.sendResponse(response, 200, 'Moo', user);
    }

    constructor() {
        super();
        this.createGetRoute('/', UserRouter.getUsers);
        this.createGetRoute('/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', UserRouter.getUser);
        this.createPostRoute('/', UserRouter.createUser);
        this.createAllRoute('*', (_request: Request, response: Response) => BaseRouter.send404(response));
    }
}
