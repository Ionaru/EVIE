import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { generateNumbersArray } from '@ionaru/array-utils';
import { EVE, ICharacterBlueprintsData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { Scope } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class BlueprintsService extends BaseService {

    public async getBlueprints(character: Character): Promise<ICharacterBlueprintsData> {
        BaseService.confirmRequiredScope(character, Scope.BLUEPRINTS, 'getBlueprints');

        const response = await this.getBlueprintsPage(character, 1);

        if (!response) {
            return [];
        }

        const blueprints = response.body || [];

        if (response.headers.has('x-pages')) {
            const pages = Number(response.headers.get('x-pages'));
            if (pages > 1) {
                const pageIterable = generateNumbersArray(pages, 2);

                await Promise.all(pageIterable.map(async (page) => {
                    const pageResponse = await this.getBlueprintsPage(character, page);
                    if (pageResponse && pageResponse.body) {
                        blueprints.push(...pageResponse.body);
                    }
                }));
            }
        }

        return blueprints;
    }

    public async getBlueprintsPage(character: Character, page: number) {
        const url = EVE.getCharacterBlueprintsUrl(character.characterId, page);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(
            url,
            {headers, observe: 'response'},
        ).toPromise<HttpResponse<ICharacterBlueprintsData>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response;
    }
}
