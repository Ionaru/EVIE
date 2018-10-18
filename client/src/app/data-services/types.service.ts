import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../../shared/eve.helper';
import { IServerResponse, ITypesData } from '../../shared/interface.helper';
import { BaseService } from './base.service';

@Injectable()
export class TypesService extends BaseService {

    public async getTypes(...typeIds: number[]): Promise<ITypesData[] | undefined> {
        const url = 'data/types';
        const response = await this.http.post<any>(url, typeIds).toPromise<IServerResponse<ITypesData[]>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }
        return response.data;
    }

    public async getType(typeId: number): Promise<ITypesData | undefined> {
        const url = EVE.getUniverseTypesUrl(typeId);
        const response = await this.http.get<any>(url).toPromise<ITypesData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }
        return response;
    }
}
