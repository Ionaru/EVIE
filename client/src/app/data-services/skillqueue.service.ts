import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { ISkillQueueData } from '../../shared/interface.helper';
import { Character } from '../models/character/character.model';

@Injectable()
export class SkillQueueService {
    constructor(private http: HttpClient) { }

    public async getSkillQueue(character: Character): Promise<ISkillQueueData[]> {
        const url = EVE.constructESIURL(2, 'characters', character.characterId, 'skillqueue');
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ISkillQueueData[]>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
