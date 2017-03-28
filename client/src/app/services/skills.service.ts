import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Logger } from 'angular2-logger/core';
import { Character } from '../models/character/character.model';
import { Helpers } from '../shared/helpers';

export interface SkillData {
  skills: Array<{
    current_skill_level: number,
    skill_id: number,
    skillpoints_in_skill: number,
    name?: string
  }>;
  total_sp: number;
}

export interface SkillQueueData {
  start_date: string;
  finish_date: string;

  skill_id: number;
  finished_level: number;
  queue_position: number;

  training_start_sp: number;
  level_start_sp: number;
  level_end_sp: number;

  name?: string;
}

@Injectable()
export class SkillService {

  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService,
              private helpers: Helpers) { }

  async getSkills(character: Character): Promise<SkillData> {
    const url = this.endpointService.constructESIUrl('v3/characters', character.characterId, 'skills');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers: headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return null;
      }

      const skillData: SkillData = response.json();

      if (this.helpers.isEmpty(skillData)) {
        this.logger.error('Data did not contain expected values', skillData);
        return null;
      }

      return skillData;

    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }

  async getSkillQueue(character: Character): Promise<Array<SkillQueueData>> {
    const url = this.endpointService.constructESIUrl('v2/characters', character.characterId, 'skillqueue');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers: headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return null;
      }

      const skillData: Array<SkillQueueData> = response.json();

      if (this.helpers.isEmpty(skillData)) {
        this.logger.error('Data did not contain expected values', skillData);
        return null;
      }

      return skillData;

    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }
}
