import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BaseService, IServerResponse } from './base.service';

export interface IUsersResponseCharacters {
    accessToken: string;
    characterId: number;
    id: number;
    isActive: boolean;
    name: string;
    ownerHash: string;
    refreshToken: string;
    scopes: string;
    tokenExpiry: Date;
    uuid: string;
    user: IUsersResponse;
}

export interface IUsersResponse {
    id: number;
    isAdmin: boolean;
    lastLogin: Date;
    timesLogin: number;
    username: string;
    uuid: string;
}

@Injectable()
export class UsersService extends BaseService {

    public async getUsers() {
        const url = 'api/users';
        const response = await this.http.get<any>(url).toPromise<IServerResponse<IUsersResponseCharacters[]>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }
        return response.data;
    }
}
