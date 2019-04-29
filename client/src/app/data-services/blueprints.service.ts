import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterBlueprintsData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { ScopesComponent } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class BlueprintsService extends BaseService {

    public async getBlueprints(character: Character): Promise<ICharacterBlueprintsData[]> {
        BaseService.confirmRequiredScope(character, ScopesComponent.scopeCodes.BLUEPRINTS, 'getBlueprints');

        const url = EVE.getCharacterBlueprintsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterBlueprintsData[]>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
