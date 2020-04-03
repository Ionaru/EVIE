import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IIndustrySystemsCostIndexActivity, IIndustrySystemsDataUnit } from '@ionaru/eve-utils';

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
    [index: string]: string | undefined;
}

interface IRefiningCache {
    [index: string]: string;
}

@Injectable()
export class IndustryService extends BaseService {

    private manufacturingCache: IManufacturingCache = {};
    private refiningCache: IRefiningCache = {};

    public async getManufacturingData(typeId: number): Promise<IManufacturingData | undefined> {
        const url = `data/manufacturing/${typeId}`;

        if (url in this.manufacturingCache) {
            // tslint:disable-next-line:no-non-null-assertion
            return this.manufacturingCache[url] ? JSON.parse(this.manufacturingCache[url]!) as IManufacturingData : undefined;
        }

        const response = await this.http.get<any>(url).toPromise<IServerResponse<IManufacturingData>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        const data = response ? response.data : undefined;
        this.manufacturingCache[url] = response ? JSON.stringify(response.data) : undefined;
        return data;
    }

    public async getRefiningProducts(typeId: number): Promise<IRefiningProducts[]> {
        const url = `data/refining/${typeId}`;

        if (url in this.refiningCache) {
            return JSON.parse(this.refiningCache[url]) as IRefiningProducts[];
        }

        const response = await this.http.get<any>(url).toPromise<IServerResponse<IRefiningProducts[]>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }

        const data = response && response.data ? response.data : [];
        this.refiningCache[url] = JSON.stringify(data);
        return data;
    }

    public async getSystem(systemId: number): Promise<IIndustrySystemsDataUnit | undefined> {
        const url = `data/industry/system/${systemId}`;

        const response = await this.http.get<any>(url).toPromise<IServerResponse<IIndustrySystemsDataUnit>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response.data;
    }

    public async getSystemCostIndex(systemId: number): Promise<number | void> {
        const url = `data/industry/system/${systemId}`;

        const response = await this.http.get<any>(url).toPromise<IServerResponse<IIndustrySystemsDataUnit>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        const productionIndex = response.data.cost_indices.find(
            (index) => index.activity === IIndustrySystemsCostIndexActivity.MANUFACTURING
        );
        if (!productionIndex) {
            return;
        }

        return productionIndex.cost_index;
    }
}
