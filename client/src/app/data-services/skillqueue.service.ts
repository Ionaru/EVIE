import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterSkillQueueData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { ScopesComponent } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class SkillQueueService extends BaseService {

    public async getSkillQueue(character: Character): Promise<ICharacterSkillQueueData> {
        BaseService.confirmRequiredScope(character, ScopesComponent.scopeCodes.SKILLQUEUE, 'getSkillQueue');

        const url = EVE.getCharacterSkillQueueUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterSkillQueueData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
