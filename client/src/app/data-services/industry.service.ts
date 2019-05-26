import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BaseService, IServerResponse } from './base.service';

export interface IManufacturingData {
    blueprintId: number;
    materials: Array<{
        id: number,
        quantity: number,
    }>;
    skills: Array<{
        id: number,
        level: number,
    }>;
    time: number;
    result: {
        id: number,
        quantity: number,
    };
}

export interface IRefiningProducts {
    id: number;
    quantity: number;
}

interface IManufacturingCache {
    [index: string]: IManufacturingData | undefined;
}

interface IRefiningCache {
    [index: string]: IRefiningProducts[];
}

@Injectable()
export class IndustryService extends BaseService {

    private manufacturingCache: IManufacturingCache = {};
    private refiningCache: IRefiningCache = {};

    public async getManufacturingData(typeId: number): Promise<IManufacturingData | undefined> {
        const url = `data/manufacturing/${typeId}`;

        if (this.manufacturingCache.hasOwnProperty(url)) {
            return this.manufacturingCache[url];
        }

        const response = await this.http.get<any>(url).toPromise<IServerResponse<IManufacturingData>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        const data = response ? response.data : undefined;
        this.manufacturingCache[url] = data;
        return data;
    }

    public async getRefiningProducts(typeId: number): Promise<IRefiningProducts[]> {
        const url = `data/refining/${typeId}`;

        if (this.refiningCache.hasOwnProperty(url)) {
            return this.refiningCache[url];
        }

        const response = await this.http.get<any>(url).toPromise<IServerResponse<IRefiningProducts[]>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }

        const data = response && response.data ? response.data : [];
        this.refiningCache[url] = data;
        return data;
    }

    public async getBlueprintProduct(typeId: number): Promise<number | undefined> {
        const url = `data/blueprint-product/${typeId}`;

        const response = await this.http.get<any>(url).toPromise<IServerResponse<number>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response && response.data ? response.data : undefined;
    }
}
