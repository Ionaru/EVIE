import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { ISkillCategoryData, ISkillGroupData } from '../../shared/interface.helper';

@Injectable()
export class SkillGroupsService {

    constructor(private http: HttpClient) { }

    public async getSkillGroupInformation(): Promise<ISkillGroupData[]> {
        const skillInfo: ISkillGroupData[] = [];

        const skillCategory = await this.getSkillCategory();

        if (!skillCategory) {
            return skillInfo;
        }

        const skillGroupIds = skillCategory.groups;

        await Promise.all(skillGroupIds.map(async (skillGroupId) => {
            const group = await this.getSkillGroup(skillGroupId);

            console.log(group);

            if (group && group.published) {
                skillInfo.push(group);
            }
        }));

        Common.sortArrayByObjectProperty(skillInfo, 'name');

        return skillInfo;
    }

    private async getSkillCategory(): Promise<ISkillCategoryData | undefined> {
        const url = EVE.getUniverseCategoriesUrl(EVE.skillCategoryId);
        const response = await this.http.get<any>(url).toPromise<ISkillCategoryData>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    private async getSkillGroup(groupId: number): Promise<ISkillGroupData | undefined> {
        const url = EVE.getUniverseGroupsUrl(groupId);
        const response = await this.http.get<any>(url).toPromise<ISkillGroupData>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
