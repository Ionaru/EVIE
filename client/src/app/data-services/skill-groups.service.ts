import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Helpers } from '../shared/helpers';

export interface ISkillCategoryData {
    category_id: number;
    name: string;
    published: boolean;
    groups: number[];
}

export interface ISkillGroupData {
    group_id: number;
    name: string;
    published: boolean;
    category_id: number;
    types: number[];
}

@Injectable()
export class SkillGroupsService {

    private skillCategoryId = 16;

    constructor(private http: HttpClient) { }

    public async getSkillGroupInformation(): Promise<ISkillGroupData[]> {
        const skillInfo: ISkillGroupData[] = [];

        const skillGroups = await this.getSkillGroupIds();

        await Promise.all(skillGroups.map(async (skillGroup) => {
            const group = await this.getSkillGroup(skillGroup);

            // Remove group 505 (Fake Skills)
            if (group && group.group_id !== 505) {
                skillInfo.push(group);
            }
        }));

        Helpers.sortArrayByObjectProperty(skillInfo, 'name');

        return skillInfo;
    }

    private async getSkillGroupIds(): Promise<number[]> {
        const url = Helpers.constructESIURL(1, 'universe', 'categories', this.skillCategoryId);
        const response = await this.http.get<any>(url).toPromise<ISkillCategoryData>()
            .catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response.groups;
    }

    private async getSkillGroup(groupId: number): Promise<ISkillGroupData | undefined> {
        const url = Helpers.constructESIURL(1, 'universe', 'groups', groupId);
        const response = await this.http.get<any>(url).toPromise<ISkillGroupData>()
            .catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
