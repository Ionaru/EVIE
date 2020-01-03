import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, IUniverseConstellationData } from '@ionaru/eve-utils';

import { BaseService } from './base.service';

@Injectable()
export class ConstellationsService extends BaseService {

    // TODO: Move to server for caching & multi-lookup.

    public async getConstellation(constellationId: number): Promise<IUniverseConstellationData | void> {
        const url = EVE.getUniverseConstellationUrl(constellationId);
        const response = await this.http.get<any>(url).toPromise<IUniverseConstellationData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    public async getConstellations(): Promise<number[] | void> {
        const url = EVE.getUniverseConstellationsUrl();
        const response = await this.http.get<any>(url).toPromise<number[]>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
