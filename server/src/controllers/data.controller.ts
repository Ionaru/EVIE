import {
    EVE,
    IIndustryActivityData, IIndustryActivityMaterialsData, IIndustryActivityProductsData, IIndustryActivitySkillsData,
    IInvTypeMaterialsData, IMarketGroupData, IndustryActivity, IUniverseCategoriesData, IUniverseGroupsData, IUniverseTypesData,
} from '@ionaru/eve-utils';

import { esiService } from '../index';

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
            blueprint = industryProducts.filter((product) =>
                product.productTypeID === typeId && product.activityID === IndustryActivity.manufacturing)[0];
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
        return esiService.fetchESIData<IUniverseCategoriesData>(EVE.getUniverseCategoriesUrl(categoryId));
    }

    public static getUniverseGroup(groupId: number) {
        return esiService.fetchESIData<IUniverseGroupsData>(EVE.getUniverseGroupsUrl(groupId));
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

        const typeData: IUniverseTypesData[] = [];

        await Promise.all(typeIds.map(async (typeId) => {
            let tries = 0;

            let type: IUniverseTypesData | undefined;

            while (!type) {
                if (tries > 3) {
                    throw new Error(`Unable to get Type ${typeId}`);
                }

                type = await esiService.fetchESIData<IUniverseTypesData>(EVE.getUniverseTypesUrl(typeId));
                tries++;
            }

            typeData.push(type);
        }));

        return typeData;
    }
}
