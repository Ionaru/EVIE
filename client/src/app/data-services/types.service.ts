import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../../shared/eve.helper';
import { IServerResponse, ITypesData } from '../../shared/interface.helper';
import { BaseService } from './base.service';

@Injectable()
export class TypesService extends BaseService {

    private typesCache: ITypesData[] = [];

    public async getTypes(...typeIds: number[]): Promise<ITypesData[] | undefined> {
        const typesFromCache = this.typesCache.filter((type) => typeIds.includes(type.type_id));

        if (typesFromCache.length === typeIds.length) {
            return typesFromCache;
        }

        const cachedTypeIds = typesFromCache.map((type) => type.type_id);
        const missingTypes = typeIds.filter((typeId) => !cachedTypeIds.includes(typeId));

        const url = 'data/types';
        const response = await this.http.post<any>(url, missingTypes).toPromise<IServerResponse<ITypesData[]>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }

        if (response.data) {
            this.typesCache.push(...response.data);
            this.typesCache = Array.from(new Set(this.typesCache));
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
