import { EVE } from '../../../client/src/shared/eve.helper';
import {
    IIndustryActivity,
    IIndustryActivityMaterials,
    IIndustryActivityProducts,
    IIndustryActivitySkills,
    IIndustrySystemsData,
    IInvTypeMaterials,
    IManufacturingData,
    IMarketGroup,
    IMarketPriceData,
    IndustryActivity,
    IRefiningProducts,
    ISkillCategoryData,
    ISkillGroupData,
    ITypesData,
} from '../../../client/src/shared/interface.helper';
import { BaseESIService } from '../services/base-esi.service';

export class DataController {

    public static async getCostIndices(systemId: number): Promise<IIndustrySystemsData | undefined> {
        const systemsData = await BaseESIService.fetchESIData<IIndustrySystemsData[]>(EVE.getIndustrySystemsURL());

        if (!systemsData) {
            return;
        }

        return systemsData.filter((systemData) => systemData.solar_system_id === systemId)[0];
    }

    public static async getMarketPrice(typeId: number): Promise<IMarketPriceData | undefined> {
        const marketPrices = await BaseESIService.fetchESIData<IMarketPriceData[]>(EVE.getMarketPricesURL());

        if (!marketPrices) {
            return;
        }

        return marketPrices.filter((marketPriceData) => marketPriceData.type_id === typeId)[0];
    }

    public static async getRefiningProducts(typeId: number): Promise<IRefiningProducts[]> {
        const materials = await BaseESIService.fetchESIData<IInvTypeMaterials[]>(EVE.getInvTypeMaterialsUrl());
        if (!materials) {
            return [];
        }

        const mt = materials.filter((material) => material.typeID === typeId);
        return mt.map((material) => ({id: material.materialTypeID, quantity: material.quantity}));
    }

    public static async getManufacturingInfo(typeId: number): Promise<IManufacturingData | undefined> {

        const industryProducts = await BaseESIService.fetchESIData<IIndustryActivityProducts[]>(EVE.getIndustryActivityProductsUrl());

        let blueprint;

        if (industryProducts) {
            blueprint = industryProducts.filter((product) =>
                product.productTypeID === typeId && product.activityID === IndustryActivity.manufacturing)[0];
        }

        if (!blueprint) {
            return;
        }

        const industryData = await Promise.all([
            BaseESIService.fetchESIData<IIndustryActivityMaterials[]>(EVE.getIndustryActivityMaterialsUrl()),
            BaseESIService.fetchESIData<IIndustryActivitySkills[]>(EVE.getIndustryActivitySkillsUrl()),
            BaseESIService.fetchESIData<IIndustryActivity[]>(EVE.getIndustryActivityUrl()),
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
        return BaseESIService.fetchESIData<ISkillCategoryData>(EVE.getUniverseCategoriesUrl(categoryId));
    }

    public static getUniverseGroup(groupId: number) {
        return BaseESIService.fetchESIData<ISkillGroupData>(EVE.getUniverseGroupsUrl(groupId));
    }

    public static async getMarketIds() {
        const marketGroups = await BaseESIService.fetchESIData<number[]>(EVE.getMarketGroupsUrl());

        const marketIds: number[] = [];

        if (marketGroups) {
            await Promise.all(marketGroups.map(async (groupId) => {
                const marketGroup = await BaseESIService.fetchESIData<IMarketGroup>(EVE.getMarketGroupUrl(groupId));

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

                type = await BaseESIService.fetchESIData<ITypesData>(EVE.getUniverseTypesUrl(typeId));
                tries++;
            }

            typeData.push(type);
        }));

        return typeData;
    }
}
