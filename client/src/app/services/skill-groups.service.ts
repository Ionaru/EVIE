import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Logger } from 'angular2-logger/core';
import { Helpers } from '../shared/helpers';

export interface SkillCategoryData {
  category_id: number;
  name: string;
  published: boolean;
  groups: Array<number>;
}

export interface SkillGroupData {
  group_id: number;
  name: string;
  published: boolean;
  category_id: number;
  types: Array<number>;
}

@Injectable()
export class SkillGroupsService {

  skillCategoryId = 16;

  constructor(private http: Http, private logger: Logger, private helpers: Helpers, private endpointService: EndpointService) {}

  async getSkillGroupInformation(): Promise<Array<SkillGroupData>> {
    const skillInfo = [];

    const skillGroups = await this.getSkillGroupIds();

    await Promise.all(skillGroups.map(async (skillGroup) => {
      const group = await this.getSkillGroup(skillGroup);

      // Remove group 505 (Fake Skills)
      if (group.group_id !== 505) {
        skillInfo.push(group);
      }
    }));

    this.helpers.sortArrayByObjectProperty(skillInfo, 'name');

    return skillInfo;
  }

  async getSkillGroupIds(): Promise<Array<number>> {
    const url = this.endpointService.constructESIUrl('v1/universe/categories', this.skillCategoryId);
    let response: Response;
    try {
      response = await this.http.get(url).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return null;
      }

      const skillCategory: SkillCategoryData = response.json();

      if (Helpers.isEmpty(skillCategory)) {
        this.logger.error('Data did not contain expected values', skillCategory);
        return null;
      }

      return skillCategory.groups;

    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }

  async getSkillGroup(groupId: number): Promise<SkillGroupData> {
    const url = this.endpointService.constructESIUrl('v1/universe/groups', groupId);
    let response: Response;
    try {
      response = await this.http.get(url).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return null;
      }

      const skillGroup: SkillGroupData = response.json();

      if (Helpers.isEmpty(skillGroup)) {
        this.logger.error('Data did not contain expected values', skillGroup);
        return null;
      }

      return skillGroup;

    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }
}
