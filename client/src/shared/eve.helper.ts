/**
 * Several static helper functions for the EVE Online ESI.
 */
export class EVE {

    public static readonly ESIURL = 'https://esi.evetech.net';
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

    public static getUniverseGroupsUrl(groupId: number) {
        return EVE.constructESIURL(1, 'universe', 'groups', groupId);
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
