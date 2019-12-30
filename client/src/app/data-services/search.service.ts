import { Injectable } from '@angular/core';
import { IUniverseNamesDataUnit } from '@ionaru/eve-utils';

import { BaseService, IServerResponse } from './base.service';

@Injectable()
export class SearchService extends BaseService {

    public searchType(q: string) {
        return this.http.get<IServerResponse<IUniverseNamesDataUnit | undefined>>('https://search.spaceships.app/type/', {
            params: {q},
        });
    }
}
