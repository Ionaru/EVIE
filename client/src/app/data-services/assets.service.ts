import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { generateNumbersArray } from '@ionaru/array-utils';
import { EVE, ICharacterAssetsData, ICharacterAssetsLocationsData, ICharacterAssetsNamesData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { Scope } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class AssetsService extends BaseService {

    public async getAssets(character: Character): Promise<ICharacterAssetsData> {
        BaseService.confirmRequiredScope(character, Scope.ASSETS, 'getAssets');

        const response = await this.getAssetsPage(character, 1);

        if (!response) {
            return [];
        }

        const assets = response.body || [];

        if (response.headers.has(BaseService.pagesHeaderName)) {
            const pages = Number(response.headers.get(BaseService.pagesHeaderName));
            if (pages > 1) {
                const pageIterable = generateNumbersArray(pages, 2);

                await Promise.all(pageIterable.map(async (page) => {
                    const pageResponse = await this.getAssetsPage(character, page);
                    if (pageResponse && pageResponse.body) {
                        assets.push(...pageResponse.body);
                    }
                }));
            }
        }

        return assets;
    }

    public async getAssetsLocations(character: Character, items: number[]): Promise<ICharacterAssetsLocationsData> {
        BaseService.confirmRequiredScope(character, Scope.ASSETS, 'getAssets');

        const url = EVE.getCharacterAssetsLocationsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.post<any>(
            url,
            items,
            {headers},
        ).toPromise<ICharacterAssetsLocationsData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }

    public async getAssetsNames(character: Character, items: number[]): Promise<ICharacterAssetsNamesData> {
        BaseService.confirmRequiredScope(character, Scope.ASSETS, 'getAssets');

        const url = EVE.getCharacterAssetsNamesUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.post<any>(
            url,
            items,
            {headers},
        ).toPromise<ICharacterAssetsNamesData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }

    private async getAssetsPage(character: Character, page: number) {
        const url = EVE.getCharacterAssetsUrl(character.characterId, page);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(
            url,
            {headers, observe: 'response'},
        ).toPromise<HttpResponse<ICharacterAssetsData>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response;
    }
}
