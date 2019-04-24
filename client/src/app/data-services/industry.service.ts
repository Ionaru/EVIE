import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
    IIndustrySystemsData,
    IManufacturingData,
    IRefiningProducts,
    IServerResponse,
} from '../../shared/interface.helper';
import { BaseService } from './base.service';

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

    public async getSystemCostIndices(systemId: number): Promise<IIndustrySystemsData | undefined> {
        const url = `data/cost-indices/${systemId}`;

        const response = await this.http.get<any>(url)
            .toPromise<IServerResponse<IIndustrySystemsData>>()
            .catch(this.catchHandler);

        if (response instanceof HttpErrorResponse || !response.data) {
            return;
        }

        return response.data;
    }
}
