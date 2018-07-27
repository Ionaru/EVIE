import { Request, Response } from 'express';
import * as httpStatus from 'http-status-codes';
import fetch from 'node-fetch';

import { BaseRouter } from './base.router';
import { ISkillGroupData, ISkillCategoryData, ITypesData } from '../../../client/src/shared/interface.helper';

export class DataRouter extends BaseRouter {

    /**
     * Delete a user
     * path: /api/delete
     * method: POST
     * params:
     *  uuid: The uuid of the user to delete
     *  password: The password of the user to delete, for verification
     * returns:
     *  200 UserDeleted: The user was deleted successfully
     *  401 WrongPassword: The oldPassword parameter did not match the user's current password
     *  403 NotYourUser: A user tried to change another user's password
     *  404 UserNotFound: The UUID did not match any known user
     *  400 MissingParameters: One of the parameters was missing
     *  401 NotLoggedIn: The user session was not found, possibly not logged in
     */
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

        console.log(typeIds);

        return DataRouter.sendResponse(response, httpStatus.OK, 'OK');
    }

    constructor() {
        super();

        // Fetch skill types (from group 16)
        // Fetch type info
        // Cache it all

        // fetch('https://esi.evetech.net/v1/universe/categories/16/').then((response) => {
        //     response.json().then((body) => {
        //         console.log(body);
        //     });
        // });

        // this.getSkills().then();

        // this.createGetRoute('/handshake', DataRouter.doHandShake);
        this.createPostRoute('/types', DataRouter.getTypes);
        // this.createPostRoute('/logout', DataRouter.logoutUser);
        // this.createPostRoute('/register', DataRouter.registerUser);
        // this.createPostRoute('/change/username', DataRouter.changeUserUsername);
        // this.createPostRoute('/change/password', DataRouter.changeUserPassword);
        // this.createPostRoute('/change/email', DataRouter.changeUserEmail);
        // this.createPostRoute('/delete', DataRouter.deleteUser);
    }

    private async getSkills(): Promise<void> {
        const response = await fetch('https://esi.evetech.net/v1/universe/categories/16/');
        const body = await response.json() as ISkillCategoryData;

        const skillIds: number[] = [];

        await Promise.all(body.groups.map(async (groupId) => {
            const groupResponse = await fetch(`https://esi.evetech.net/v1/universe/groups/${groupId}/`);
            const groupData = await groupResponse.json() as ISkillGroupData;

            if (groupData.published) {
                skillIds.push(...groupData.types);
            }
        }));

        const skills: ITypesData[] = [];

        await Promise.all(skillIds.map(async (typeId) => {
            const typesResponse = await fetch(`https://esi.evetech.net/v3/universe/types/${typeId}/`);
            const typesData = await typesResponse.json() as ITypesData;

            console.log(typesData);

            if (typesData.published) {
                skills.push(typesData);
            }
        }));

        console.log(skills);

        // for (const group of body.groups) {
        //
        // }

        // console.log(body);
    }
}
