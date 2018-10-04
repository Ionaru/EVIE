import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { IServerResponse, IUsersResponse } from '../../shared/interface.helper';

@Injectable()
export class UsersService {
    constructor(private http: HttpClient) { }

    public async getUsers(): Promise<IUsersResponse[] | undefined> {
        const url = 'api/users';
        const response = await this.http.get<any>(url).toPromise<IServerResponse<IUsersResponse[]>>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }
        return response.data;
    }
}
