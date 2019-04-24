/**
 * Several static helper functions for the EVE Online ESI.
 */
export class EVE {

    public static readonly ESIURL = 'https://esi.evetech.net';
    public static readonly SDEURL = 'https://sde.zzeve.com';
    public static useTestServer = false;

    public static readonly skillCategoryId = 16;

    /* tslint:disable:object-literal-sort-keys */
    public static readonly mineral = Object.freeze({
        tritanium: 34,
        pyerite: 35,
        mexallon: 36,
        isogen: 37,
        nocxium: 38,
        zydrine: 39,
        megacyte: 40,
        morphite: 11399,
    });
    /* tslint:enable:object-literal-sort-keys */

    public static readonly minerals = Object.freeze([
        EVE.mineral.tritanium,
        EVE.mineral.pyerite,
        EVE.mineral.mexallon,
        EVE.mineral.isogen,
        EVE.mineral.nocxium,
        EVE.mineral.zydrine,
        EVE.mineral.megacyte,
        EVE.mineral.morphite,
    ]);

    /* tslint:disable:object-literal-sort-keys */
    public static readonly ore = Object.freeze({

        veldspar: 1230,
        concentratedVeldspar: 17470,
        denseVeldspar: 17471,
        stableVeldspar: 46689,

        scordite: 1228,
        condensedScordite: 17459,
        massiveScordite: 17464,
        glossyScordite: 46687,

        pyroxeres: 1224,
        solidPyroxeres: 17459,
        viscousPyroxeres: 17460,
        opulentPyroxeres: 46686,

        plagioclase: 18,
        azurePlagioclase: 17455,
        richPlagioclase: 17456,
        sparklingPlagioclase: 46685,

        omber: 1227,
        silveryOmber: 17867,
        goldenOmber: 17868,
        platinoidOmber: 46684,

        kernite: 20,
        luminousKernite: 17452,
        fieryKernite: 17453,
        resplendantKernite: 46683,

        jaspet: 1226,
        pureJaspet: 17448,
        pristineJaspet: 17449,
        immaculateJaspet: 46682,

        hemorphite: 1231,
        vividHemorphite: 17444,
        radiantHemorphite: 17445,
        scintillatingHemorphite: 46681,

        hedbergite: 21,
        vitricHedbergite: 17440,
        glazedHedbergite: 17441,
        lustrousHedbergite: 46680,

        gneiss: 1229,
        iridescentGneiss: 17865,
        prismaticGneiss: 17866,
        brilliantGneiss: 46679,

        darkOchre: 1232,
        onyxOchre: 17436,
        obsidianOchre: 17437,
        jetOchre: 46675,

        spodumain: 19,
        brightSpodumain: 17466,
        gleamingSpodumain: 17467,
        dazzlingSpodumain: 46688,

        crokite: 1225,
        sharpCrokite: 17432,
        crystallineCrokite: 17433,
        pellucidCrokite: 46677,

        bistot: 1223,
        triclinicBistot: 17428,
        monoclinicBistot: 17429,
        cubicBistot: 46676,

        arkonor: 22,
        crimsonArkonor: 17425,
        primeArkonor: 17426,
        flawlessArkonor: 46678,

        mercoxit: 11396,
        magmaMercoxit: 17869,
        vitreousMercoxit: 17870,
    });
    /* tslint:enable:object-literal-sort-keys */

    public static readonly ores = Object.freeze({
        all: [
            // Base, 5%, 10%, 15% (Moon)
            // HighSec Ores
            EVE.ore.veldspar, EVE.ore.concentratedVeldspar, EVE.ore.denseVeldspar, EVE.ore.stableVeldspar,
            EVE.ore.scordite, EVE.ore.condensedScordite, EVE.ore.massiveScordite, EVE.ore.glossyScordite,
            EVE.ore.pyroxeres, EVE.ore.solidPyroxeres, EVE.ore.viscousPyroxeres, EVE.ore.opulentPyroxeres,
            EVE.ore.plagioclase, EVE.ore.azurePlagioclase, EVE.ore.richPlagioclase, EVE.ore.sparklingPlagioclase,
            EVE.ore.omber, EVE.ore.silveryOmber, EVE.ore.goldenOmber, EVE.ore.platinoidOmber,
            EVE.ore.kernite, EVE.ore.luminousKernite, EVE.ore.fieryKernite, EVE.ore.resplendantKernite,
            // LowSec Ores
            EVE.ore.jaspet, EVE.ore.pureJaspet, EVE.ore.pristineJaspet, EVE.ore.immaculateJaspet,
            EVE.ore.hemorphite, EVE.ore.vividHemorphite, EVE.ore.radiantHemorphite, EVE.ore.scintillatingHemorphite,
            EVE.ore.hedbergite, EVE.ore.vitricHedbergite, EVE.ore.glazedHedbergite, EVE.ore.lustrousHedbergite,
            // NullSec Ores
            EVE.ore.gneiss, EVE.ore.iridescentGneiss, EVE.ore.prismaticGneiss, EVE.ore.brilliantGneiss,
            EVE.ore.darkOchre, EVE.ore.onyxOchre, EVE.ore.obsidianOchre, EVE.ore.jetOchre,
            EVE.ore.spodumain, EVE.ore.brightSpodumain, EVE.ore.gleamingSpodumain, EVE.ore.dazzlingSpodumain,
            EVE.ore.crokite, EVE.ore.sharpCrokite, EVE.ore.crystallineCrokite, EVE.ore.pellucidCrokite,
            EVE.ore.bistot, EVE.ore.triclinicBistot, EVE.ore.monoclinicBistot, EVE.ore.cubicBistot,
            EVE.ore.arkonor, EVE.ore.crimsonArkonor, EVE.ore.primeArkonor, EVE.ore.flawlessArkonor,
            EVE.ore.mercoxit, EVE.ore.magmaMercoxit, EVE.ore.vitreousMercoxit,
        ],
        highSec: {
            base: [
                EVE.ore.veldspar,
                EVE.ore.scordite,
                EVE.ore.pyroxeres,
                EVE.ore.plagioclase,
                EVE.ore.omber,
                EVE.ore.kernite,
            ],
            beltVariants: [
                EVE.ore.concentratedVeldspar, EVE.ore.denseVeldspar,
                EVE.ore.condensedScordite, EVE.ore.massiveScordite,
                EVE.ore.solidPyroxeres, EVE.ore.viscousPyroxeres,
                EVE.ore.azurePlagioclase, EVE.ore.richPlagioclase,
                EVE.ore.silveryOmber, EVE.ore.goldenOmber,
                EVE.ore.luminousKernite, EVE.ore.fieryKernite,
            ],
            moonVariants: [
                EVE.ore.stableVeldspar,
                EVE.ore.glossyScordite,
                EVE.ore.opulentPyroxeres,
                EVE.ore.sparklingPlagioclase,
                EVE.ore.platinoidOmber,
                EVE.ore.resplendantKernite,
            ],
        },
        lowSec: {
            base: [
                EVE.ore.jaspet,
                EVE.ore.hemorphite,
                EVE.ore.hedbergite,
            ],
            beltVariants: [
                EVE.ore.pureJaspet, EVE.ore.pristineJaspet,
                EVE.ore.vividHemorphite, EVE.ore.radiantHemorphite,
                EVE.ore.vitricHedbergite, EVE.ore.glazedHedbergite,
            ],
            moonVariants: [
                EVE.ore.immaculateJaspet,
                EVE.ore.scintillatingHemorphite,
                EVE.ore.lustrousHedbergite,
            ],
        },
        nullSec: {
            base: [
                EVE.ore.gneiss,
                EVE.ore.darkOchre,
                EVE.ore.spodumain,
                EVE.ore.crokite,
                EVE.ore.bistot,
                EVE.ore.arkonor,
                EVE.ore.mercoxit,
            ],
            beltVariants: [
                EVE.ore.iridescentGneiss, EVE.ore.prismaticGneiss,
                EVE.ore.onyxOchre, EVE.ore.obsidianOchre,
                EVE.ore.brightSpodumain, EVE.ore.gleamingSpodumain,
                EVE.ore.sharpCrokite, EVE.ore.crystallineCrokite,
                EVE.ore.triclinicBistot, EVE.ore.monoclinicBistot,
                EVE.ore.crimsonArkonor, EVE.ore.primeArkonor,
                EVE.ore.magmaMercoxit, EVE.ore.vitreousMercoxit,
            ],
            moonVariants: [
                EVE.ore.brilliantGneiss,
                EVE.ore.jetOchre,
                EVE.ore.dazzlingSpodumain,
                EVE.ore.pellucidCrokite,
                EVE.ore.cubicBistot,
                EVE.ore.flawlessArkonor,
            ],
        },
    });

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

    public static getMarketPricesURL() {
        return EVE.constructESIURL(1, 'markets', 'prices');
    }

    public static getIndustrySystemsURL() {
        return EVE.constructESIURL(1, 'industry', 'systems');
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
