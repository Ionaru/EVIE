import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { IManufacturingData, IReprocessingProductsData, IServerResponse } from '../../shared/interface.helper';
import { BaseService } from './base.service';

interface IManufacturingCache {
    [index: string]: any;
}

@Injectable()
export class IndustryService extends BaseService {

    private manufacturingCache: IManufacturingCache = {};

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

    public async getReprocessingProducts(typeId: number): Promise<IReprocessingProductsData[]> {
        const url = `data/reprocessing/${typeId}`;

        if (this.manufacturingCache.hasOwnProperty(url)) {
            return this.manufacturingCache[url];
        }

        const response = await this.http.get<any>(url).toPromise<IServerResponse<IReprocessingProductsData[]>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }

        const data = response ? response.data : undefined;
        this.manufacturingCache[url] = data;
        return data || [];
    }
}
