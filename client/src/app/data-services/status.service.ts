import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, IStatusData } from '@ionaru/eve-utils';

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
