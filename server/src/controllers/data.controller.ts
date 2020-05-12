import {
    EVE,
    IIndustryActivityData,
    IIndustryActivityMaterialsData,
    IIndustryActivityProductsData,
    IIndustryActivitySkillsData,
    IIndustrySystemsData,
    IIndustrySystemsDataUnit,
    IInvTypeMaterialsData,
    IMarketGroupData,
    IMarketPricesData,
    IndustryActivity,
    IPlanetSchematicsTypeMapData,
    IUniverseCategoryData,
    IUniverseGroupData,
    IUniverseTypeData,
} from '@ionaru/eve-utils';

import { esiCache, esiService } from '../index';

interface IManufacturingData {
    blueprintId: number;
    materials: Array<{
        id: number;
        quantity: number;
    }>;
    skills: Array<{
        id: number;
        level: number;
    }>;
    time: number;
    result: {
        id: number;
        quantity: number;
    };
}

interface IPIInfo {
    P1: number[];
    P2: number[];
    P3: number[];
    P4: number[];
}

interface IPISchematic {
    id: number;
    quantity: number;
}

export class DataController {

    public static async getPISchematic(typeId: number): Promise<IPISchematic[] | undefined> {
        const planetSchematicsTypeMap = await esiService.fetchESIData<IPlanetSchematicsTypeMapData>(EVE.getPlanetSchematicsTypeMapUrl());
        if (!planetSchematicsTypeMap) {
            return;
        }

        const schematic = planetSchematicsTypeMap.find((x) => !x.isInput && x.typeID === typeId);
        if (!schematic) {
            return
        }

        const components = planetSchematicsTypeMap.filter((x) => x.isInput && x.schematicID === schematic.schematicID);

        return components.map((component) => {
            return {
                id: component.typeID,
                quantity: component.quantity,
            }
        })
    }

    public static async getPIInfo(): Promise<IPIInfo | undefined> {
        // 1333
        // 1334
        // 1335
        // 1336
        // 1337

        const [P1Group, P2Group, P3Group, P4Group] = await Promise.all([
            esiService.fetchESIData<IMarketGroupData>(EVE.getMarketGroupUrl(1334)),
            esiService.fetchESIData<IMarketGroupData>(EVE.getMarketGroupUrl(1335)),
            esiService.fetchESIData<IMarketGroupData>(EVE.getMarketGroupUrl(1336)),
            esiService.fetchESIData<IMarketGroupData>(EVE.getMarketGroupUrl(1337)),
        ]);

        return {
            P1: P1Group.types,
            P2: P2Group.types,
            P3: P3Group.types,
            P4: P4Group.types,
        }
    }

    public static async getIndustrySystem(systemId: number): Promise<IIndustrySystemsDataUnit | undefined> {
        const industrySystems = await esiService.fetchESIData<IIndustrySystemsData>(EVE.getIndustrySystemsUrl());
        if (!industrySystems) {
            return;
        }

        return industrySystems.find((industrySystem) => industrySystem.solar_system_id === systemId);
    }

    public static async getRefiningProducts(typeId: number): Promise<Array<{ id: number; quantity: number }>> {
        const materials = await esiService.fetchESIData<IInvTypeMaterialsData>(EVE.getInvTypeMaterialsUrl());
        if (!materials) {
            return [];
        }

        const mt = materials.filter((material) => material.typeID === typeId);
        return mt.map((material) => ({id: material.materialTypeID, quantity: material.quantity}));
    }

    public static async getManufacturingInfo(typeId: number): Promise<IManufacturingData | void> {

        const industryProducts = await esiService.fetchESIData<IIndustryActivityProductsData>(EVE.getIndustryActivityProductsUrl());

        let blueprint;

        if (industryProducts) {
            blueprint = industryProducts.find((product) =>
                product.productTypeID === typeId && product.activityID === IndustryActivity.MANUFACTURING);
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

            const bluePrint = industryProducts.find((product) =>
                product.productTypeID === typeId && product.activityID === IndustryActivity.MANUFACTURING);

            if (!bluePrint) {
                return;
            }

            const materials = industryMaterials.filter((material) =>
                material.typeID === bluePrint.typeID && material.activityID === IndustryActivity.MANUFACTURING);
            const skills = industrySkills.filter((skill) =>
                skill.typeID === bluePrint.typeID && skill.activityID === IndustryActivity.MANUFACTURING);
            const time = industryActivities.find((activity) =>
                activity.typeID === bluePrint.typeID && activity.activityID === IndustryActivity.MANUFACTURING);

            return {
                blueprintId: bluePrint.typeID,
                materials: materials.map((mat) => ({id: mat.materialTypeID, quantity: mat.quantity})),
                result: {id: typeId, quantity: bluePrint.quantity},
                skills: skills.map((skill) => ({id: skill.skillID, level: skill.level})),
                time: time!.time,
            };
        }
    }

    public static async getUniverseCategory(categoryId: number) {
        return esiService.fetchESIData<IUniverseCategoryData>(EVE.getUniverseCategoryUrl(categoryId));
    }

    public static async getUniverseGroup(groupId: number) {
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

        const url = EVE.getUniverseTypeUrl(typeId);

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

    public static async getEstimatedItemValue(typeId: number): Promise<number | void> {
        let value = 0;

        const url = EVE.getMarketPricesUrl();
        const response = await esiService.fetchESIData<IMarketPricesData>(url).catch(() => undefined);
        if (!response) {
            return;
        }

        const itemPrices = response.find((item) => item.type_id === typeId);

        if (!itemPrices) {
            return;
        }

        const manufacturingData = await DataController.getManufacturingInfo(typeId);

        if (!manufacturingData) {
            return itemPrices.adjusted_price;
        }

        for (const subMaterial of manufacturingData.materials) {
            const subPrice = await this.getEstimatedItemValue(subMaterial.id);

            if (!subPrice) {
                return;
            }

            value += (subPrice * subMaterial.quantity);
        }

        return value;
    }
}
