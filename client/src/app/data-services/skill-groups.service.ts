import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { ISkillCategoryData, ISkillGroupData } from '../../shared/interface.helper';

@Injectable()
export class SkillGroupsService {

    private skillCategoryId = 16;

    constructor(private http: HttpClient) { }

    public async getSkillGroupInformation(): Promise<ISkillGroupData[]> {
        const skillInfo: ISkillGroupData[] = [];

        const skillGroups = await this.getSkillGroupIds();

        await Promise.all(skillGroups.map(async (skillGroup) => {
            const group = await this.getSkillGroup(skillGroup);

            console.log(group);

            if (group && group.published) {
                skillInfo.push(group);
            }
        }));

        Common.sortArrayByObjectProperty(skillInfo, 'name');

        return skillInfo;
    }

    private async getSkillGroupIds(): Promise<number[]> {
        const url = EVE.constructESIURL(1, 'universe', 'categories', this.skillCategoryId);
        const response = await this.http.get<any>(url).toPromise<ISkillCategoryData>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response.groups;
    }

    private async getSkillGroup(groupId: number): Promise<ISkillGroupData | undefined> {
        const url = EVE.constructESIURL(1, 'universe', 'groups', groupId);
        const response = await this.http.get<any>(url).toPromise<ISkillGroupData>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }
}
