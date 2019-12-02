import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUniverseTypeData } from '@ionaru/eve-utils';

import { BaseService, IServerResponse } from './base.service';

@Injectable()
export class TypesService extends BaseService {

    private typesCache: IUniverseTypeData[] = [];

    public async getTypes(...typeIds: number[]): Promise<IUniverseTypeData[] | undefined> {
        const typesFromCache = this.typesCache.filter((type) => typeIds.includes(type.type_id));

        if (typesFromCache.length === typeIds.length) {
            return typesFromCache;
        }

        const cachedTypeIds = typesFromCache.map((type) => type.type_id);
        const missingTypes = typeIds.filter((typeId) => !cachedTypeIds.includes(typeId));

        const url = 'data/types';
        const headers = new HttpHeaders({'x-evie-token': BaseService.serverToken});
        const response = await this.http.post<any>(url, missingTypes, {headers})
            .toPromise<IServerResponse<IUniverseTypeData[]>>()
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

    public async getType(typeId: number): Promise<IUniverseTypeData | undefined> {
        const types = await this.getTypes(typeId);
        if (!types || !types.length) {
            return undefined;
        }
        return types[0];
    }
}
