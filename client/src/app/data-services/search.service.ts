import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUniverseNamesDataUnit } from '@ionaru/eve-utils';

import { BaseService, IServerResponse } from './base.service';

export type SearchType = 'type' | 'region' | 'system' | 'constellation';

interface ISearchCache {
    [key: string]: IUniverseNamesDataUnit;
}

@Injectable()
export class SearchService extends BaseService {

    private static searchCache: ISearchCache = {};

    public async search(q: string, searchType: SearchType) {

        const searchKey = `${searchType}:${q}`;
        if (SearchService.searchCache[searchKey]) {
            return SearchService.searchCache[searchKey];
        }

        const response = await this.search$(q, searchType).toPromise().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        if (response.data) {
            SearchService.searchCache[searchKey] = response.data;
        }

        return response.data;
    }

    public search$(q: string, searchType: SearchType) {
        return this.http.get<IServerResponse<IUniverseNamesDataUnit | undefined>>(`https://search.spaceships.app/${searchType}/`, {
            params: {q},
        });
    }
}
