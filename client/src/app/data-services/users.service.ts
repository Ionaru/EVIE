import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { IServerResponse, IUsersResponse } from '../../shared/interface.helper';
import { BaseService } from './base.service';

@Injectable()
export class UsersService extends BaseService {

    public async getUsers(): Promise<IUsersResponse[] | undefined> {
        const url = 'api/users';
        const response = await this.http.get<any>(url).toPromise<IServerResponse<IUsersResponse[]>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }
        return response.data;
    }
}
