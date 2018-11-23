import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../../shared/eve.helper';
import { IIndustryJobsData } from '../../shared/interface.helper';
import { Character } from '../models/character/character.model';
import { BaseService } from './base.service';

@Injectable()
export class IndustryJobsService extends BaseService {

    public async getIndustryJobs(character: Character): Promise<IIndustryJobsData[]> {
        const url = EVE.getIndustryJobsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<IIndustryJobsData[]>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
