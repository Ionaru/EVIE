import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';

import { EVE } from '../../shared/eve.helper';
import { ISkillCategoryData, ISkillGroupData } from '../../shared/interface.helper';
import { BaseService } from './base.service';

@Injectable()
export class SkillGroupsService extends BaseService {

    public async getSkillGroupInformation(): Promise<ISkillGroupData[]> {
        const skillInfo: ISkillGroupData[] = [];

        const skillCategory = await this.getSkillCategory();

        if (!skillCategory) {
            return skillInfo;
        }

        const skillGroupIds = skillCategory.groups;

        await Promise.all(skillGroupIds.map(async (skillGroupId) => {
            const group = await this.getSkillGroup(skillGroupId);

            if (group && group.published) {
                skillInfo.push(group);
            }
        }));

        sortArrayByObjectProperty(skillInfo, 'name');

        return skillInfo;
    }

    private async getSkillCategory(): Promise<ISkillCategoryData | undefined> {
        const url = EVE.getUniverseCategoriesUrl(EVE.skillCategoryId);
        const response = await this.http.get<any>(url).toPromise<ISkillCategoryData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    private async getSkillGroup(groupId: number): Promise<ISkillGroupData | undefined> {
        const url = EVE.getUniverseGroupsUrl(groupId);
        const response = await this.http.get<any>(url).toPromise<ISkillGroupData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
