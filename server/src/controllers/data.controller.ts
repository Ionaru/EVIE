import axios, { AxiosError, AxiosResponse } from 'axios';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { EVE } from '../../../client/src/shared/eve.helper';
import { ISkillCategoryData, ISkillGroupData, ITypesData, IIndustryActivityProducts } from '../../../client/src/shared/interface.helper';
import { CacheController } from './cache.controller';

export class DataController {

    public static deprecationsLogged: string[] = [];

    public static async getManufacuringInfo(typeId: number) {
        const x = await DataController.fetchESIData<IIndustryActivityProducts[]>(EVE.getIndustryActivityProductsUrl());

        if (x) {
            const bluePrintId = x.filter((activity) => activity.productTypeID === typeId && activity.activityID === 1);
            console.log(bluePrintId[0].typeID);
        }

        const y = await DataController.fetchESIData(EVE.getIndustryActivityMaterialsUrl());
        console.log(typeId);
    }

    public static getUniverseCategory(categoryId: number) {
        return DataController.fetchESIData<ISkillCategoryData>(EVE.getUniverseCategoriesUrl(categoryId));
    }

    public static getUniverseGroup(groupId: number) {
        return DataController.fetchESIData<ISkillGroupData>(EVE.getUniverseGroupsUrl(groupId));
    }

    public static async getSkillIds() {
        const skillsCategory = await DataController.getUniverseCategory(EVE.skillCategoryId);

        const skillIds: number[] = [];

        if (skillsCategory) {
            await Promise.all(skillsCategory.groups.map(async (groupId) => {
                const skillGroup = await DataController.getUniverseGroup(groupId);

                if (skillGroup && skillGroup.published) {
                    skillIds.push(...skillGroup.types);
                }
            }));
        }

        return skillIds;
    }

    public static async getSkillTypes() {

        const skillIds = await DataController.getSkillIds();

        const skillTypes: ITypesData[] = [];

        await Promise.all(skillIds.map(async (typeId) => {
            const skillType = await DataController.getUniverseTypes(typeId);

            if (skillType && skillType.length && skillType[0].published) {
                skillTypes.push(skillType[0]);
            }
        }));

        return skillTypes;
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
        let response: AxiosResponse<any> | undefined;

        if (CacheController.responseCache[url] && !CacheController.isExpired(CacheController.responseCache[url])) {
            return CacheController.responseCache[url].data as T;
        }

        logger.debug(url);
        response = await axios.get(url).catch((error: AxiosError) => {
            logger.error('Request failed:', url, error);
            return undefined;
        });

        if (response) {
            if (response.status === httpStatus.OK) {
                if (response.headers.warning) {
                    DataController.logWarning(url, response.headers.warning);
                }

                if (response.headers.expires) {
                    logger.debug(url, response.headers.expires);
                    CacheController.responseCache[url] = {
                        data: response.data,
                        expiry: new Date(response.headers.expires).getTime(),
                    };
                }

                return response.data as T;

            } else {
                logger.error('Request not OK:', url, response.status, response.statusText, response.data);
            }
        }

        return;
    }

    public static logWarning(route: string, text?: string) {
        if (!DataController.deprecationsLogged.includes(route)) {
            logger.warn('HTTP request warning:', route, text);
            DataController.deprecationsLogged.push(route);
        }
    }
}
