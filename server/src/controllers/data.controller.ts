import {
    EVE,
    IIndustryActivityData, IIndustryActivityMaterialsData, IIndustryActivityProductsData, IIndustryActivitySkillsData,
    IInvTypeMaterialsData, IMarketGroupData, IndustryActivity, IUniverseCategoryData, IUniverseGroupData, IUniverseTypeData,
} from '@ionaru/eve-utils';

import { esiCache, esiService } from '../index';

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

    public static async getRefiningProducts(typeId: number): Promise<Array<{ id: number, quantity: number }>> {
        const materials = await esiService.fetchESIData<IInvTypeMaterialsData>(EVE.getInvTypeMaterialsUrl());
        if (!materials) {
            return [];
        }

        const mt = materials.filter((material) => material.typeID === typeId);
        return mt.map((material) => ({id: material.materialTypeID, quantity: material.quantity}));
    }

    public static async getManufacturingInfo(typeId: number): Promise<IManufacturingData | undefined> {

        const industryProducts = await esiService.fetchESIData<IIndustryActivityProductsData>(EVE.getIndustryActivityProductsUrl());

        let blueprint;

        if (industryProducts) {
            blueprint = industryProducts.find((product) =>
                product.productTypeID === typeId && product.activityID === IndustryActivity.manufacturing);
        }

        if (!blueprint) {
            return;
        }

        const industryData = await Promise.all([
            esiService.fetchESIData<IIndustryActivityMaterialsData>(EVE.getIndustryActivityMaterialsUrl()),
            esiService.fetchESIData<IIndustryActivitySkillsData>(EVE.getIndustryActivitySkillsUrl()),
            esiService.fetchESIData<IIndustryActivityData>(EVE.getIndustryActivityUrl()),
        ]);

        const [industryMaterials, industrySkills, industryActivities] = industryData;

        if (industryProducts && industryMaterials && industrySkills && industryActivities) {

            let bpInfo: IManufacturingData;

            const bluePrint = industryProducts.find((product) =>
                product.productTypeID === typeId && product.activityID === IndustryActivity.manufacturing);

            if (!bluePrint) {
                return;
            }

            const materials = industryMaterials.filter((material) =>
                material.typeID === bluePrint.typeID && material.activityID === IndustryActivity.manufacturing);
            const skills = industrySkills.filter((skill) =>
                skill.typeID === bluePrint.typeID && skill.activityID === IndustryActivity.manufacturing);
            const time = industryActivities.find((activity) =>
                activity.typeID === bluePrint.typeID && activity.activityID === IndustryActivity.manufacturing);

            bpInfo = {
                blueprintId: bluePrint.typeID,
                materials: materials.map((mat) => ({id: mat.materialTypeID, quantity: mat.quantity})),
                result: {id: typeId, quantity: bluePrint.quantity},
                skills: skills.map((skill) => ({id: skill.skillID, level: skill.level})),
                time: time!.time,
            };

            return bpInfo;
        }

        return;
    }

    public static getUniverseCategory(categoryId: number) {
        return esiService.fetchESIData<IUniverseCategoryData>(EVE.getUniverseCategoryUrl(categoryId));
    }

    public static getUniverseGroup(groupId: number) {
        return esiService.fetchESIData<IUniverseGroupData>(EVE.getUniverseGroupUrl(groupId));
    }

    public static async getMarketIds() {
        const marketGroups = await esiService.fetchESIData<number[]>(EVE.getMarketGroupsUrl());

        const marketIds: number[] = [];

        if (marketGroups) {
            await Promise.all(marketGroups.map(async (groupId) => {
                const marketGroup = await esiService.fetchESIData<IMarketGroupData>(EVE.getMarketGroupUrl(groupId));

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

        const typeData: IUniverseTypeData[] = [];

        await Promise.all(typeIds.map(async (typeId) => {
            const type = await DataController.getUniverseType(typeId);
            typeData.push(type);
        }));

        return typeData;
    }

    public static async getUniverseType(typeId: number) {
        let tries = 0;

        let type: IUniverseTypeData | undefined;

        const url = EVE.getUniverseTypesUrl(typeId);

        while (!type || tries < 3) {

            type = await esiService.fetchESIData<IUniverseTypeData>(url).catch(() => undefined);

            tries++;
        }

        if (!type) {
            // Try to get a result from a previously cached response.
            type = esiCache.responseCache[url] && esiCache.responseCache[url]!.data;
        }

        if (!type) {
            throw new Error(`Unable to get Type ${typeId}`);
        }

        return type;
    }
}
