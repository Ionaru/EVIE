import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../../shared/eve.helper';
import { IServerResponse, ISkillsData, ITypesData } from '../../shared/interface.helper';
import { Character } from '../models/character/character.model';
import { ScopesComponent } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class SkillsService extends BaseService {

    public async getSkillsData(character: Character): Promise<ISkillsData | undefined> {
        BaseService.confirmRequiredScope(character, ScopesComponent.scopeCodes.SKILLS, 'getSkillsData');

        const url = EVE.getCharacterSkillsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ISkillsData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    public async getAllSkills(): Promise<any | undefined> {
        const url = 'data/skill-types';
        const response = await this.http.get<any>(url).toPromise<IServerResponse<ITypesData>>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response.data;
    }
}
