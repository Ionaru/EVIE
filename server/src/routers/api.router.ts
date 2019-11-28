import { generateRandomString } from '@ionaru/random-string';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';

import { User } from '../models/user.model';
import { BaseRouter } from './base.router';

export class APIRouter extends BaseRouter {

    /**
     * Request that will return the user session, this is used when the client first loads.
     * path: /api/handshake
     * method: GET
     * returns:
     *  200 LoggedIn: The client has an active session
     *  200 NotLoggedIn: No client session was found
     */
    private static async doHandShake(request: Request, response: Response): Promise<Response> {

        request.session!.token = generateRandomString(10);
        response.setHeader('x-evie-token', request.session!.token);

        if (!request.session!.user.id) {
            return APIRouter.sendSuccessResponse(response);
        }

        const user: User | undefined = await User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne();

        if (!user) {
            // No user found that matches the ID in the session.
            delete request.session!.user.id;
            return APIRouter.sendSuccessResponse(response);
        }

        user.timesLogin++;
        user.lastLogin = new Date();
        user.save().then();

        return APIRouter.sendResponse(response, httpStatus.OK, 'LoggedIn', user.sanitizedCopy);
    }

    /**
     * Destroy the user session.
     * path: /api/logout
     * method: POST
     */
    private static async logoutUser(request: Request, response: Response): Promise<Response | void> {

        User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id: request.session!.user.id})
            .getOne().then((user) => {
            if (user && (!user.characters || !user.characters.length)) {
                user.remove().then();
            }
        });

        request.session!.destroy(() => {
            response.end();
        });
    }

    constructor() {
        super();
        this.createRoute('get', '/handshake', APIRouter.doHandShake);
        this.createRoute('post', '/logout', APIRouter.logoutUser);
    }
}
