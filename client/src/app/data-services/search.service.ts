import { Injectable } from '@angular/core';
import { IUniverseNamesDataUnit } from '@ionaru/eve-utils';

import { BaseService, IServerResponse } from './base.service';

export type SearchType = 'type' | 'region' | 'system' | 'constellation';

@Injectable()
export class SearchService extends BaseService {

    public search(q: string, searchType: SearchType) {
        return this.http.get<IServerResponse<IUniverseNamesDataUnit | undefined>>(`https://search.spaceships.app/${searchType}/`, {
            params: {q},
        });
    }
}
