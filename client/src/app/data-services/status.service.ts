import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { IStatusData } from '../../shared/interface.helper';

@Injectable()
export class StatusService {
    constructor(private http: HttpClient) { }

    public async getStatus(): Promise<IStatusData | void> {
        const url = EVE.getStatusUrl();
        const response = await this.http.get<any>(url).toPromise<IStatusData>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
