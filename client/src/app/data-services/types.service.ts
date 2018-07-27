import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';

@Injectable()
export class TypesService {
    constructor(private http: HttpClient) { }

    public async getTypes(): Promise<void> {
        const url = 'data/types';
        const response = await this.http.post<any>(url, [1, 2, 3]).toPromise<any>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        console.log(response);
    }
}
