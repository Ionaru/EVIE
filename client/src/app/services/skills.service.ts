import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Logger } from 'angular2-logger/core';
import { Character } from '../models/character/character.model';
import { Helpers } from '../shared/helpers';

export interface Skill {
  current_skill_level: number;
  skill_id: number;
  skillpoints_in_skill: number;
  name?: string;
}

export interface SkillData {
  skills: Array<Skill>;
  skillsObject: {
    [id: number]: Skill;
  };
  total_sp: number;
}

@Injectable()
export class SkillsService {

  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

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

      const skillDataArray: SkillData = response.json();

      if (Helpers.isEmpty(skillDataArray)) {
        this.logger.error('Data did not contain expected values', skillDataArray);
        return null;
      }

      const skillsData = {};
      for (const skill of skillDataArray.skills) {
        skillsData[skill.skill_id] = skill;
      }

      skillDataArray.skillsObject = skillsData;

      return skillDataArray;

    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }
}
