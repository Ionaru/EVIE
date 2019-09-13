import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, IUniverseSystemData } from '@ionaru/eve-utils';

import { BaseService } from './base.service';

@Injectable()
export class SystemsService extends BaseService {

    // TODO: Move to server for caching & multi-lookup.

    public async getSystemInfo(stationId: number): Promise<IUniverseSystemData | void> {
        const url = EVE.getUniverseSystemUrl(stationId);
        const response = await this.http.get<any>(url).toPromise<IUniverseSystemData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
