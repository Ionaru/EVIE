import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, IUniverseConstellationData } from '@ionaru/eve-utils';

import { BaseService } from './base.service';

@Injectable()
export class ConstellationsService extends BaseService {

    public async getConstellation(constellationId: number): Promise<IUniverseConstellationData | void> {
        const url = EVE.getUniverseConstellationUrl(constellationId);
        const response = await this.http.get<any>(url).toPromise<IUniverseConstellationData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
