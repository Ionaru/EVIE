import * as fs from 'fs';
import { logger } from 'winston-pnp-logger';
import { DataController } from './data.controller';

interface IvalidateCacheReturn {
    useCache: boolean;
    eveVersion?: string;
}

export class CacheController {

    public static cacheFolder = 'data';
    public static eveVersionFileName = 'eve_version.txt';

    public static async cacheValid(): Promise<IvalidateCacheReturn> {

        const eveStatus = await DataController.getEveStatus();
        if (!eveStatus) {
            logger.error('Could not get EVE Online server status, using cache if possible');
            return {useCache: true};
        }

        const eveVersionFilePath = `${CacheController.cacheFolder}/${CacheController.eveVersionFileName}`;
        const eveVersion = CacheController.readFileContents(eveVersionFilePath);
        if (eveStatus.server_version === eveVersion) {
            logger.info(`EVE Online server version matches saved version, using cache`);
            return {useCache: true, eveVersion: eveStatus.server_version};
        }

        logger.info(`EVE Online server version does not match saved version (or there is no saved version), cache invalid`);
        return {useCache: false, eveVersion: eveStatus.server_version};
    }

    // public static cacheFilesExist() {
    //
    // }

    public static readFileContents(filePath: string, deleteIfError = false): string | undefined {
        if (fs.existsSync(filePath)) {
            try {
                return fs.readFileSync(filePath).toString();
            } catch {
                logger.warn(`The file ${filePath} could not be read.`);
                if (deleteIfError) {
                    logger.warn(`Deleting the file ${filePath}.`);
                    try {
                        fs.unlinkSync(filePath);
                        logger.warn(`File ${filePath} deleted.`);
                    } catch (e) {
                        logger.warn(`The file ${filePath} could not be deleted, please delete manually. Reason: ${e}`);
                    }
                }
            }
        }
        return;
    }

    constructor() {
        CacheController.cacheValid().then((result) => {
            console.log(result);
            if (result.eveVersion) {
                fs.writeFileSync(`${CacheController.cacheFolder}/${CacheController.eveVersionFileName}`, result.eveVersion);
            }
        });
        // DataController.fetchESIData(`legacy/universe/races/`).then();
    }

    // public async checkAndUpdateCache()
}
