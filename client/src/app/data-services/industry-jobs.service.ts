import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { IIndustryJobsData } from '../../shared/interface.helper';
import { Character } from '../models/character/character.model';

@Injectable()
export class IndustryJobsService {

    constructor(private http: HttpClient) { }

    public async getIndustryJobs(character: Character): Promise<IIndustryJobsData[]> {
        const url = EVE.getIndustryJobsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: 'Bearer ' + character.accessToken});
        const response = await this.http.get<any>(url, {headers}).toPromise<IIndustryJobsData[]>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
