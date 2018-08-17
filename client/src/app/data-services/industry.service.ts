import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { IManufacturingData, IServerResponse } from '../../shared/interface.helper';
import { BaseService } from './base.service';

@Injectable()
export class IndustryService extends BaseService {

    public async getManufacturingData(typeId: number): Promise<IManufacturingData | undefined> {
        const url = `data/manufacturing/${typeId}`;
        const response = await this.http.get<any>(url).toPromise<IServerResponse<IManufacturingData>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response.data;
    }
}
