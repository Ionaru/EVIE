/**
 * Several static helper functions.
 */
export class EVE {

    public static ESIURL = 'https://esi.evetech.net';
    public static useTestServer = false;

    public static constructESIURL(version: number, ...path: Array<string | number>): string {
        let url = `${EVE.ESIURL}/v${version}/`;
        if (path.length) {
            url += `${path.join('/')}/`;
        }

        if (EVE.useTestServer) {
            url += '?datasource=singularity';
        }

        return url;
    }
}
