import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { EVE, IUniverseCategoriesData, IUniverseGroupsData } from '@ionaru/eve-utils';

import { BaseService } from './base.service';

@Injectable()
export class SkillGroupsService extends BaseService {

    public async getSkillGroupInformation(): Promise<IUniverseGroupsData[]> {
        const skillInfo: IUniverseGroupsData[] = [];

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

    private async getSkillCategory(): Promise<IUniverseCategoriesData | undefined> {
        const url = EVE.getUniverseCategoriesUrl(EVE.skillCategoryId);
        const response = await this.http.get<any>(url).toPromise<IUniverseCategoriesData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    private async getSkillGroup(groupId: number): Promise<IUniverseGroupsData | undefined> {
        const url = EVE.getUniverseGroupsUrl(groupId);
        const response = await this.http.get<any>(url).toPromise<IUniverseGroupsData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
