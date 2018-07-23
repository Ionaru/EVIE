import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Character } from '../models/character/character.model';
import { Helpers } from '../shared/helpers';

export interface ISkillData {
    active_skill_level: number;
    skill_id: number;
    skillpoints_in_skill: number;
    trained_skill_level: number;
}

export interface ISkillsData {
    skills: ISkillData[];
    total_sp: number;
    unallocated_sp?: number;
}

@Injectable()
export class SkillsService {
    constructor(private http: HttpClient) { }

    public async getSkillsData(character: Character): Promise<ISkillsData | undefined> {
        const url = Helpers.constructESIURL(4, 'characters', character.characterId, 'skills');
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ISkillsData>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
