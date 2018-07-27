import fetch, { FetchError, Response } from 'node-fetch';
import { logger } from 'winston-pnp-logger';

import { EVE } from '../../../client/src/shared/eve.helper';
import { ISkillCategoryData, ISkillGroupData, IStatusData, ITypesData } from '../../../client/src/shared/interface.helper';

export class DataController {

    public static deprecationsLogged: string[] = [];

    public static async getSkillTypes() {
        const response = await fetch('https://esi.evetech.net/v1/universe/categories/16/');
        const body = await response.json() as ISkillCategoryData;

        const skillIds: number[] = [];

        await Promise.all(body.groups.map(async (groupId) => {
            const groupResponse = await fetch(`https://esi.evetech.net/v1/universe/groups/${groupId}/`);
            const groupData = await groupResponse.json() as ISkillGroupData;

            if (groupData.published) {
                skillIds.push(...groupData.types);
            }
        }));

        const skills: ITypesData[] = [];

        await Promise.all(skillIds.map(async (typeId) => {
            const typesResponse = await fetch(`https://esi.evetech.net/v3/universe/types/${typeId}/`);
            const typesData = await typesResponse.json() as ITypesData;

            console.log(typesData);

            if (typesData.published) {
                skills.push(typesData);
            }
        }));

        console.log(skills);
    }

    public static async getEveStatus() {
        return DataController.fetchESIData(EVE.getStatusUrl()) as Promise<IStatusData | undefined>;
    }

    public static async getTypeInfo(typeId: number) {
        return DataController.fetchESIData(EVE.getUniverseTypesUrl(typeId)) as Promise<ITypesData | undefined>;
    }

    public static async fetchESIData(url: string): Promise<object | undefined> {
        logger.debug(url);
        const response: Response | undefined = await fetch(url).catch((errorResponse: FetchError) => {
            logger.error('Request failed:', url, errorResponse);
            return undefined;
        });
        if (response) {
            if (response.ok) {

                // Log warnings on ESI routes.
                if (response.headers.get('warning')) {
                    DataController.logDeprecation(url, response.headers.get('warning') || undefined);
                }

                return response.json().catch((error) => {
                    logger.error('Unable to parse JSON:', error);
                    return undefined;
                });
            } else {
                const text = await response.text();
                logger.error('Request not OK:', url, response.status, response.statusText, text);
            }
        }
        return undefined;
    }

    public static logDeprecation(route: string, text?: string) {
        if (!DataController.deprecationsLogged.includes(route)) {
            logger.warn('ESI route warning:', route, text);
            DataController.deprecationsLogged.push(route);
        }
    }
}
