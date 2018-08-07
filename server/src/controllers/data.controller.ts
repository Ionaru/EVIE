import axios, { AxiosError } from 'axios';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { EVE } from '../../../client/src/shared/eve.helper';
import { ISkillCategoryData, ISkillGroupData, IStatusData, ITypesData } from '../../../client/src/shared/interface.helper';
import { CacheController } from './cache.controller';

export class DataController {

    public static deprecationsLogged: string[] = [];

    public static async getSkillTypes() {

        let skillsCategory: ISkillCategoryData | undefined;

        if (CacheController.eveDataCache.categories && CacheController.eveDataCache.categories[EVE.skillCategoryId]) {
            skillsCategory = CacheController.eveDataCache.categories[EVE.skillCategoryId];
        } else {
            skillsCategory = await DataController.fetchESIData<ISkillCategoryData>(EVE.getUniverseCategoriesUrl(EVE.skillCategoryId));
            CacheController.eveDataCache.categories = CacheController.eveDataCache.categories || {};
            CacheController.eveDataCache.categories[EVE.skillCategoryId] = skillsCategory;
        }

        const skills: ITypesData[] = [];

        if (skillsCategory) {
            await Promise.all(skillsCategory.groups.map(async (groupId) => {

                let skillGroup: ISkillGroupData | undefined;

                if (CacheController.eveDataCache.groups && CacheController.eveDataCache.groups[groupId]) {
                    skillGroup = CacheController.eveDataCache.groups[groupId];
                } else {
                    skillGroup = await DataController.fetchESIData<ISkillGroupData>(EVE.getUniverseGroupsUrl(groupId));
                    CacheController.eveDataCache.groups = CacheController.eveDataCache.groups || {};
                    CacheController.eveDataCache.groups[groupId] = skillGroup;
                }

                if (skillGroup && skillGroup.published) {

                    await Promise.all(skillGroup.types.map(async (typeId) => {
                        // const skillType = await DataController.fetchESIData<ITypesData>(EVE.getUniverseTypesUrl(typeId));

                        let skillType: ITypesData | undefined;

                        if (CacheController.eveDataCache.types && CacheController.eveDataCache.types[typeId]) {
                            skillType = CacheController.eveDataCache.types[typeId];
                        } else {
                            skillType = (await DataController.getUniverseTypes(typeId))[0];
                            CacheController.eveDataCache.types = CacheController.eveDataCache.types || {};
                            CacheController.eveDataCache.types[typeId] = skillType;
                        }

                        if (skillType && skillType.published) {
                            skills.push(skillType);
                        }
                    }));
                }
            }));
        }

        return skills;
    }

    public static async getEveStatus() {
        return DataController.fetchESIData<IStatusData>(EVE.getStatusUrl());
    }

    public static async getUniverseTypes(...typeIds: number[]) {

        const typeData: ITypesData[] = [];

        await Promise.all(typeIds.map(async (typeId) => {
            let tries = 0;

            let type: ITypesData | undefined;

            while (!type) {
                if (tries > 3) {
                    throw new Error(`Unable to get Type ${typeId}`);
                }

                type = await DataController.fetchESIData<ITypesData>(EVE.getUniverseTypesUrl(typeId));
                tries++;
            }

            typeData.push(type);
        }));

        return typeData;
    }

    public static async fetchESIData<T>(url: string): Promise<T | undefined> {
        logger.debug(url);

        const response = await axios.get(url).catch((error: AxiosError) => {
            logger.error('Request failed:', url, error);
            return;
        });

        if (response) {
            if (response.status === httpStatus.OK) {
                if (response.headers.warning) {
                    DataController.logDeprecation(url, response.headers.warning);
                }

                return response.data as T;

            } else {
                logger.error('Request not OK:', url, response.status, response.statusText, response.data);
            }
        }

        return;
    }

    public static logDeprecation(route: string, text?: string) {
        if (!DataController.deprecationsLogged.includes(route)) {
            logger.warn('HTTP request warning:', route, text);
            DataController.deprecationsLogged.push(route);
        }
    }
}
