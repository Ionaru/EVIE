import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Logger } from 'angular2-logger/core';
import { Character } from '../models/character/character.model';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Helpers } from '../shared/helpers';

export interface ISkill {
  current_skill_level: number;
  skill_id: number;
  skillpoints_in_skill: number;
  name?: string;
}

export interface ISkillData {
  skills: ISkill[];
  skillsObject: {
    [id: number]: ISkill;
  };
  total_sp: number;
}

@Injectable()
export class SkillsService {

  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  public async getSkills(character: Character): Promise<ISkillData> {
    const url = this.endpointService.constructESIUrl('v3/characters', character.characterId, 'skills');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return null;
      }

      const skillDataArray: ISkillData = response.json();

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
