import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Character } from '../models/character/character.model';
import { EVE } from '../shared/eve';

export interface ISkillQueueData {
    finish_date?: string;

    finished_level: number;

    level_end_sp?: number;

    // Amount of SP that was in the skill when it started training it’s current level. Used to calculate % of current level complete.
    level_start_sp?: number;

    queue_position: number;

    skill_id: number;

    start_date?: string;

    training_start_sp?: number;
}

@Injectable()
export class SkillQueueService {
    constructor(private http: HttpClient) { }

    public async getSkillQueue(character: Character): Promise<ISkillQueueData[]> {
        const url = EVE.constructESIURL(2, 'characters', character.characterId, 'skillqueue');
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ISkillQueueData[]>()
            .catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
