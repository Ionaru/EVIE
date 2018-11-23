import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../../shared/eve.helper';
import { IStatusData } from '../../shared/interface.helper';
import { BaseService } from './base.service';

@Injectable()
export class StatusService extends BaseService {

    public async getStatus(): Promise<IStatusData | void> {
        const url = EVE.getStatusUrl();
        const response = await this.http.get<any>(url).toPromise<IStatusData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
