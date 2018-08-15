import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { EVE } from '../../../client/src/shared/eve.helper';
import {
    IIndustryActivity, IIndustryActivityMaterials, IIndustryActivityProducts, IIndustryActivitySkills,
    IMarketGroup, IndustryActivity, ISkillCategoryData, ISkillGroupData, ITypesData,
} from '../../../client/src/shared/interface.helper';
import { CacheController } from './cache.controller';

interface IManufacturingData {
    blueprintId: number;
    materials: Array<{
        id: number,
        quantity: number,
    }>;
    skills: Array<{
        id: number,
        level: number,
    }>;
    time: number;
    result: {
        id: number,
        quantity: number,
    };
}

export class DataController {

    public static deprecationsLogged: string[] = [];

    public static async getManufacturingInfo(typeId: number): Promise<IManufacturingData | undefined> {

        const industryData = await Promise.all([
            DataController.fetchESIData<IIndustryActivityProducts[]>(EVE.getIndustryActivityProductsUrl()),
            DataController.fetchESIData<IIndustryActivityMaterials[]>(EVE.getIndustryActivityMaterialsUrl()),
            DataController.fetchESIData<IIndustryActivitySkills[]>(EVE.getIndustryActivitySkillsUrl()),
            DataController.fetchESIData<IIndustryActivity[]>(EVE.getIndustryActivityUrl()),
        ]);

        const [industryProducts, industryMaterials, industrySkills, industryActivities] = industryData;

        if (industryProducts && industryMaterials && industrySkills && industryActivities) {

            let bpInfo: IManufacturingData;

            const bluePrint = industryProducts.filter((product) =>
                product.productTypeID === typeId && product.activityID === IndustryActivity.manufacturing)[0];

            if (!bluePrint) {
                return;
            }

            const materials = industryMaterials.filter((material) =>
                material.typeID === bluePrint.typeID && material.activityID === IndustryActivity.manufacturing);
            const skills = industrySkills.filter((skill) =>
                skill.typeID === bluePrint.typeID && skill.activityID === IndustryActivity.manufacturing);
            const time = industryActivities.filter((activity) =>
                activity.typeID === bluePrint.typeID && activity.activityID === IndustryActivity.manufacturing)[0];

            bpInfo = {
                blueprintId: bluePrint.typeID,
                materials: materials.map((mat) => ({id: mat.materialTypeID, quantity: mat.quantity})),
                result: {id: typeId, quantity: bluePrint.quantity},
                skills: skills.map((skill) => ({id: skill.skillID, level: skill.level})),
                time: time.time,
            };

            return bpInfo;
        }

        return;
    }

    public static getUniverseCategory(categoryId: number) {
        return DataController.fetchESIData<ISkillCategoryData>(EVE.getUniverseCategoriesUrl(categoryId));
    }

    public static getUniverseGroup(groupId: number) {
        return DataController.fetchESIData<ISkillGroupData>(EVE.getUniverseGroupsUrl(groupId));
    }

    public static async getMarketIds() {
        const marketGroups = await DataController.fetchESIData<number[]>(EVE.getMarketGroupsUrl());

        const marketIds: number[] = [];

        if (marketGroups) {
            await Promise.all(marketGroups.map(async (groupId) => {
                const marketGroup = await DataController.fetchESIData<IMarketGroup>(EVE.getMarketGroupUrl(groupId));

                if (marketGroup) {
                    marketIds.push(...marketGroup.types);
                }
            }));
        }

        return marketIds;
    }

    public static async getMarketTypes() {

        const marketIds = await DataController.getMarketIds();
        const types = await DataController.getUniverseTypes(...marketIds);

        return types.filter((type) => type.published);
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
        const types = await DataController.getUniverseTypes(...skillIds);

        return types.filter((type) => type.published);
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

        if (CacheController.responseCache[url] && !CacheController.isExpired(CacheController.responseCache[url])) {
            return CacheController.responseCache[url].data as T;
        }

        const requestConfig: AxiosRequestConfig = {
            // Make sure 304 responses are not treated as errors.
            validateStatus: (status) => status === httpStatus.OK || status === httpStatus.NOT_MODIFIED,
        };

        if (CacheController.responseCache[url] && CacheController.responseCache[url].etag) {
            requestConfig.headers = {
                'If-None-Match': `${CacheController.responseCache[url].etag}`,
            };
        }

        const response = await axios.get(url, requestConfig).catch((error: AxiosError) => {
            logger.error('Request failed:', url, error);
            return undefined;
        });

        if (response) {
            logger.debug(`${url} -> ${response.status}`);
            if (response.status === httpStatus.OK) {
                if (response.headers.warning) {
                    DataController.logWarning(url, response.headers.warning);
                }

                if (response.headers.expires || response.headers.etag) {
                    CacheController.responseCache[url] = {
                        data: response.data,
                    };

                    if (response.headers.etag) {
                        CacheController.responseCache[url].etag = response.headers.etag;
                    }

                    if (response.headers.expires) {
                        CacheController.responseCache[url].expiry = new Date(response.headers.expires).getTime();
                    }
                }

                return response.data as T;

            } else if (response.status === httpStatus.NOT_MODIFIED) {
                if (response.headers.expires) {
                    CacheController.responseCache[url].expiry = new Date(response.headers.expires).getTime();
                }

                return CacheController.responseCache[url].data as T;

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
