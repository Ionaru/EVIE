import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterAssetsData, ICharacterAssetsLocationsData, ICharacterAssetsNamesData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { ScopesComponent } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class AssetsService extends BaseService {

    public async getAssets(character: Character): Promise<ICharacterAssetsData> {
        BaseService.confirmRequiredScope(character, ScopesComponent.scopeCodes.ASSETS, 'getAssets');

        const url = EVE.getCharacterAssetsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterAssetsData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }

    public async getAssetsLocations(character: Character, items: number[]): Promise<ICharacterAssetsLocationsData> {
        BaseService.confirmRequiredScope(character, ScopesComponent.scopeCodes.ASSETS, 'getAssets');

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
        BaseService.confirmRequiredScope(character, ScopesComponent.scopeCodes.ASSETS, 'getAssets');

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
}
