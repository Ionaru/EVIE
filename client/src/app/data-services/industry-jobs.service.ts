import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterIndustryJobsData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { Scope } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class IndustryJobsService extends BaseService {

    public async getIndustryJobs(character: Character): Promise<ICharacterIndustryJobsData> {
        BaseService.confirmRequiredScope(character, Scope.JOBS, 'getIndustryJobs');

        const url = EVE.getCharacterIndustryJobsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterIndustryJobsData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
