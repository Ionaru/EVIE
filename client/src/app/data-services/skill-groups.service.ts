import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { EVE, IUniverseCategoryData, IUniverseGroupData } from '@ionaru/eve-utils';

import { BaseService } from './base.service';

@Injectable()
export class SkillGroupsService extends BaseService {

    public async getSkillGroupInformation(): Promise<IUniverseGroupData[]> {
        const skillInfo: IUniverseGroupData[] = [];

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

    private async getSkillCategory(): Promise<IUniverseCategoryData | undefined> {
        const url = EVE.getUniverseCategoryUrl(EVE.skillCategoryId);
        const response = await this.http.get<any>(url).toPromise<IUniverseCategoryData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    private async getSkillGroup(groupId: number): Promise<IUniverseGroupData | undefined> {
        const url = EVE.getUniverseGroupUrl(groupId);
        const response = await this.http.get<any>(url).toPromise<IUniverseGroupData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
