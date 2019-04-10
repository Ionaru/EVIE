/**
 * Several static helper functions for the EVE Online ESI.
 */
export class EVE {

    public static readonly ESIURL = 'https://esi.evetech.net';
    public static readonly SDEURL = 'https://sde.zzeve.com';
    public static useTestServer = false;

    public static readonly skillCategoryId = 16;

    public static constructESIURL(version: number | string, ...path: Array<string | number>): string {
        let url = `${EVE.ESIURL}/v${version}/`;
        if (path.length) {
            url += `${path.join('/')}/`;
        }

        if (EVE.useTestServer) {
            url += '?datasource=singularity';
        }

        return url;
    }

    public static getIndustryActivityUrl() {
        return `${EVE.SDEURL}/industryActivity.json`;
    }

    public static getIndustryActivityProductsUrl() {
        return `${EVE.SDEURL}/industryActivityProducts.json`;
    }

    public static getIndustryActivityMaterialsUrl() {
        return `${EVE.SDEURL}/industryActivityMaterials.json`;
    }

    public static getIndustryActivitySkillsUrl() {
        return `${EVE.SDEURL}/industryActivitySkills.json`;
    }

    public static getIndustryJobsUrl(characterId: number) {
        return EVE.constructESIURL(1, 'characters', characterId, 'industry', 'jobs');
    }

    public static getStatusUrl() {
        return EVE.constructESIURL(1, 'status');
    }

    public static getUniverseNamesUrl() {
        return EVE.constructESIURL(2, 'universe/names');
    }

    public static getCharacterShipUrl(characterId: number) {
        return EVE.constructESIURL(1, 'characters', characterId, 'ship');
    }

    public static getUniverseCategoriesUrl(categoryId: number) {
        return EVE.constructESIURL(1, 'universe', 'categories', categoryId);
    }

    public static getMarketGroupsUrl() {
        return EVE.constructESIURL(1, 'markets', 'groups');
    }

    public static getMarketOrdersURL(regionId: number, typeId: number, page: number) {
        let url = EVE.constructESIURL(1, 'markets', regionId, 'orders');
        url += `?type_id=${typeId}&page=${page}&order_type=all`;
        return url;
    }

    public static getRegionsURL() {
        return EVE.constructESIURL(1, 'universe', 'regions');
    }

    public static getMarketGroupUrl(groupId: number) {
        return EVE.constructESIURL(1, 'markets', 'groups', groupId);
    }

    public static getUniverseGroupsUrl(groupId: number) {
        return EVE.constructESIURL(1, 'universe', 'groups', groupId);
    }

    public static getCharacterAttributesUrl(characterId: number) {
        return EVE.constructESIURL(1, 'characters', characterId, 'attributes');
    }

    public static getCharacterSkillQueueUrl(characterId: number) {
        return EVE.constructESIURL(2, 'characters', characterId, 'skillqueue');
    }

    public static getCharacterSkillsUrl(characterId: number) {
        return EVE.constructESIURL(4, 'characters', characterId, 'skills');
    }

    public static getCharacterWalletUrl(characterId: number) {
        return EVE.constructESIURL(1, 'characters', characterId, 'wallet');
    }

    public static getCharacterWalletJournalUrl(characterId: number) {
        return EVE.constructESIURL(4, 'characters', characterId, 'wallet', 'journal');
    }

    public static getUniverseTypesUrl(typeId: number) {
        return EVE.constructESIURL(3, 'universe', 'types', typeId);
    }
}
