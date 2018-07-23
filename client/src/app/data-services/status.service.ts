import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Helpers } from '../shared/helpers';

export interface IStatusData {
    start_time: string;
    players: number;
    server_version: string;
}

@Injectable()
export class StatusService {
    constructor(private http: HttpClient) { }

    public async getStatus(): Promise<IStatusData | void> {
        const url = Helpers.constructESIURL(1, 'status');
        const response = await this.http.get<any>(url).toPromise<IStatusData>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
