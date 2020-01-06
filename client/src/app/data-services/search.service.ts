import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUniverseNamesDataUnit } from '@ionaru/eve-utils';

import { BaseService, IServerResponse } from './base.service';

export type SearchType = 'type' | 'region' | 'system' | 'constellation';

@Injectable()
export class SearchService extends BaseService {

    public async search(q: string, searchType: SearchType) {
        const response = await this.search$(q, searchType).toPromise().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response.data;
    }

    public search$(q: string, searchType: SearchType) {
        return this.http.get<IServerResponse<IUniverseNamesDataUnit | undefined>>(`https://search.spaceships.app/${searchType}/`, {
            params: {q},
        });
    }
}
