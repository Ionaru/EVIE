import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterSkillsData, IUniverseTypeData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { Scope } from '../pages/scopes/scopes.component';
import { BaseService, IServerResponse } from './base.service';

@Injectable()
export class SkillsService extends BaseService {

    public async getSkillsData(character: Character): Promise<ICharacterSkillsData | undefined> {
        BaseService.confirmRequiredScope(character, Scope.SKILLS, 'getSkillsData');

        const url = EVE.getCharacterSkillsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterSkillsData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    public async getAllSkills(): Promise<any | undefined> {
        const url = 'data/skill-types';
        const response = await this.http.get<any>(url).toPromise<IServerResponse<IUniverseTypeData>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response.data;
    }
}
