import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, IUniverseStationData } from '@ionaru/eve-utils';

import { BaseService } from './base.service';

@Injectable()
export class StationsService extends BaseService {

    // TODO: Move to server for caching & multi-lookup.

    public async getStationInfo(stationId: number): Promise<IUniverseStationData | void> {
        const url = EVE.getUniverseStationUrl(stationId);
        const response = await this.http.get<any>(url).toPromise<IUniverseStationData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
