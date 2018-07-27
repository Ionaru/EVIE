/**
 * Several static helper functions for the EVE Online ESI.
 */
export class EVE {

    public static readonly ESIURL = 'https://esi.evetech.net';
    public static useTestServer = false;

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

    public static getUniverseTypesUrl(typeId: number) {
        return EVE.constructESIURL(3, 'universe', 'types', typeId);
    }
}
