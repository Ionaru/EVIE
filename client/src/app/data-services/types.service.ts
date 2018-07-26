import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

// export interface IStatusData {
//     start_time: string;
//     players: number;
//     server_version: string;
// }

@Injectable()
export class TypesService {
    constructor(private http: HttpClient) { }

    public async getTypes(): Promise<void> {
        const url = 'data/types';
        const response = await this.http.post<any>(url, [1, 2, 3]).toPromise<any>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        console.log(response);
    }
}
