import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, IUniverseTypesData } from '@ionaru/eve-utils';

import { BaseService, IServerResponse } from './base.service';

@Injectable()
export class TypesService extends BaseService {

    private typesCache: IUniverseTypesData[] = [];

    public async getTypes(...typeIds: number[]): Promise<IUniverseTypesData[] | undefined> {
        const typesFromCache = this.typesCache.filter((type) => typeIds.includes(type.type_id));

        if (typesFromCache.length === typeIds.length) {
            return typesFromCache;
        }

        const cachedTypeIds = typesFromCache.map((type) => type.type_id);
        const missingTypes = typeIds.filter((typeId) => !cachedTypeIds.includes(typeId));

        const url = 'data/types';
        const response = await this.http.post<any>(url, missingTypes)
            .toPromise<IServerResponse<IUniverseTypesData[]>>()
            .catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }

        if (response.data) {
            this.typesCache.push(...response.data);
            this.typesCache = Array.from(new Set(this.typesCache));
        }

        return response.data;
    }

    public async getType(typeId: number): Promise<IUniverseTypesData | undefined> {
        const url = EVE.getUniverseTypesUrl(typeId);
        const response = await this.http.get<any>(url).toPromise<IUniverseTypesData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return undefined;
        }
        return response;
    }
}
