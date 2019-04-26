import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterAttributesData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { ScopesComponent } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class AttributesService extends BaseService {

    public async getAttributes(character: Character): Promise<ICharacterAttributesData | undefined> {
        BaseService.confirmRequiredScope(character, ScopesComponent.scopeCodes.SKILLS, 'getAttributes');

        const url = EVE.getCharacterAttributesUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterAttributesData>().catch(this.catchHandler);

        if (response instanceof HttpErrorResponse) {
            return;
        }

        return response;
    }
}
