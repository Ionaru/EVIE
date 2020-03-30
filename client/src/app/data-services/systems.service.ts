import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, IIndustrySystemsData, IUniverseSystemData } from '@ionaru/eve-utils';

import { BaseService } from './base.service';

@Injectable()
export class SystemsService extends BaseService {

    // TODO: Move to server for caching & multi-lookup.

    public async getSystemInfo(systemId: number): Promise<IUniverseSystemData | void> {
        const url = EVE.getUniverseSystemUrl(systemId);
        const response = await this.http.get<any>(url).toPromise<IUniverseSystemData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    public async getSystems(): Promise<number[] | void> {
        const url = EVE.getUniverseSystemsUrl();
        const response = await this.http.get<any>(url).toPromise<number[]>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    public async getSystemCostIndex(systemId: number): Promise<number | void> {
        const url = EVE.getIndustrySystemsUrl();
        const response = await this.http.get<any>(url).toPromise<IIndustrySystemsData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        const systemIndices = response.find((system) => system.solar_system_id === systemId);
        if (!systemIndices) {
            return;
        }

        const productionIndex = systemIndices.cost_indices.find((index) => index.activity === 'manufacturing');
        if (!productionIndex) {
            return;
        }

        return productionIndex.cost_index;
    }
}
