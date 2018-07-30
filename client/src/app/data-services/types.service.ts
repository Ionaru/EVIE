import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { ITypesData } from '../../shared/interface.helper';

@Injectable()
export class TypesService {
    constructor(private http: HttpClient) { }

    public async getTypes(typeId: number): Promise<void> {
        const url = EVE.getUniverseTypesUrl(typeId);
        const response = await this.http.get<any>(url).toPromise<ITypesData>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }
        return response.groups;
    }
}
