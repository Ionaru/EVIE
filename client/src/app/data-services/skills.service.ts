import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { ISkillsData } from '../../shared/interface.helper';
import { Character } from '../models/character/character.model';

@Injectable()
export class SkillsService {
    constructor(private http: HttpClient) { }

    public async getSkillsData(character: Character): Promise<ISkillsData | undefined> {
        const url = EVE.constructESIURL(4, 'characters', character.characterId, 'skills');
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ISkillsData>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
