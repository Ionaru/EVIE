import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EndpointService } from '../models/endpoint/endpoint.service';

export interface IStatusData {
    start_time: string;
    players: number;
    server_version: string;
}

@Injectable()
export class StatusService {
    constructor(private http: HttpClient, private endpointService: EndpointService) { }

    public async getStatus(): Promise<IStatusData | void> {
        const url = this.endpointService.constructESIUrl(1, 'status');
        const response = await this.http.get<any>(url).toPromise<IStatusData>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
