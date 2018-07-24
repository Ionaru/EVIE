import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../shared/eve';

export interface IStatusData {
    start_time: string;
    players: number;
    server_version: string;
}

@Injectable()
export class StatusService {
    constructor(private http: HttpClient) { }

    public async getStatus(): Promise<IStatusData | void> {
        await this.http.get<any>('https://esi.evetech.net/legacy/universe/races/').toPromise<any>();

        const url = EVE.constructESIURL(1, 'status');
        const response = await this.http.get<any>(url).toPromise<IStatusData>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
