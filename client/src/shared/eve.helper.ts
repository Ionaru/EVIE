/**
 * Several static helper functions for the EVE Online ESI.
 */
export class EVE {

    public static readonly ESIURL = 'https://esi.evetech.net';
    public static readonly SDEURL = 'https://sde.zzeve.com';
    public static useTestServer = false;

    public static readonly skillCategoryId = 16;

    public static readonly ores = {
        all: [
            // Base, 5%, 10%, 15% (Moon)
            // HighSec Ores
            1230, 17470, 17471, 46689, // Veldspar
            1228, 17463, 17464, 46687, // Scordite
            1224, 17459, 17460, 46686, // Pyroxeres
            18, 17455, 17456, 46685, // Plagioclase
            1227, 17867, 17868, 46684, // Omber
            20, 17452, 17453, 46683, // Kernite
            // LowSec Ores
            1226, 17448, 17449, 46682, // Jaspet
            1231, 17444, 17445, 46681, // Hemorphite
            21, 17440, 17441, 46680, // Hedbergite
            // NullSec Ores
            1229, 17865, 17866, 46679, // Gneiss
            1232, 17436, 17437, 46675, // Dark Ochre
            19, 17466, 17467, 46688, // Spodumain
            1225, 17432, 17433, 46677, // Crokite
            1223, 17428, 17429, 46676, // Bistot
            22, 17425, 17426, 46678, // Arkonor
            11396, 17869, 17870, // Mercoxit
        ],
        highSec: {
            base: [1230, 1228, 1224, 18, 1227, 20],
            beltVariants: [17470, 17471, 17463, 17464, 17459, 17460, 17455, 17456, 17867, 17868, 17452, 17453],
            moonVariants: [46689, 46687, 46686, 46685, 46684, 46683],
        },
        lowSec: {
            base: [1226, 1231, 21],
            beltVariants: [17448, 17449, 17444, 17445, 17440, 17441],
            moonVariants: [46682, 46681, 46680],
        },
        nullSec: {
            base: [1229, 1232, 19, 1225, 22, 1223, 11396],
            beltVariants: [17865, 17866, 17436, 17437, 17466, 17467, 17432, 17433, 17428, 17429, 17425, 17426, 17869, 17870],
            moonVariants: [46679, 46675, 46688, 46677, 46676, 46678, 17870],
        },
    };

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

    public static getInvTypeMaterialsUrl() {
        return `${EVE.SDEURL}/invTypeMaterials.json`;
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

    public static getCharacterBlueprintsUrl(characterId: number) {
        return EVE.constructESIURL(2, 'characters', characterId, 'blueprints');
    }

    public static getStatusUrl() {
        return EVE.constructESIURL(1, 'status');
    }

    public static getUniverseNamesUrl() {
        return EVE.constructESIURL(2, 'universe', 'names');
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

    public static getMarketOrdersURL(regionId: number, typeId: number, page: number, orderType: 'buy' | 'sell' | 'all' = 'all') {
        let url = EVE.constructESIURL(1, 'markets', regionId, 'orders');
        url += `?type_id=${typeId}&page=${page}&order_type=${orderType}`;
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

    public static getUniverseStructuresUrl(structureId: number) {
        return EVE.constructESIURL(2, 'universe', 'structures', structureId);
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
