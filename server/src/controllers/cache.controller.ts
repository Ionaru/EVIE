import * as fs from 'fs';
import { logger } from 'winston-pnp-logger';
import { DataController } from './data.controller';

interface IValidateCacheReturn {
    useCache: boolean;
    eveVersion?: string;
}

interface IEVEDataCache {
    [index: string]: any;
}

export class CacheController {

    public static eveDataCache: IEVEDataCache = {};

    public static cacheFolder = 'data';
    public static eveVersionFileName = 'eve_version.txt';
    public static typesFileName = 'types.json';

    public static async bleeeeh(): Promise<any> {

        const eveStatus = await DataController.getEveStatus();

        if (!eveStatus) {
            logger.error('Could not get EVE Online server status, using cache');
            const typesFile = CacheController.readFileContents(`${CacheController.cacheFolder}/${CacheController.typesFileName}`);
            if (!typesFile) {
                logger.error('No cached data found');
                return false;
            }
        }

        const eveVersion = CacheController.readFileContents(`${CacheController.cacheFolder}/${CacheController.eveVersionFileName}`);

        // if (!eveStatus && typesFile) {
        //     logger.error('Could not get EVE Online server status, using cache');
        //     return true;
        // }

        if (eveStatus && !eveVersion) {
            logger.info('No cached data found');
            return false;
        }

        if (eveStatus && eveVersion && eveStatus.server_version === eveVersion) {
            logger.info(`EVE Online server version matches saved version, using cache`);
            return true;
        }

        if (eveStatus && eveVersion && eveStatus.server_version !== eveVersion) {
            logger.info(`EVE Online server version does not match saved version (or there is no saved version), cache invalid`);
            return false;
        }

        // throw new Error('Unable to use or renew cache');
    }

    public static async cacheValid(): Promise<IValidateCacheReturn> {

        const eveStatus = await DataController.getEveStatus();
        if (!eveStatus) {
            logger.error('Could not get EVE Online server status, using cache if possible');
            return {useCache: true};
        }

        const typesFile = CacheController.readFileContents(`${CacheController.cacheFolder}/${CacheController.typesFileName}`);
        if (!typesFile) {
            logger.info('No cached data found');
            return {useCache: false, eveVersion: eveStatus.server_version};
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

    public static async validateCache(): Promise<boolean> {

        const eveVersionFilePath = `${CacheController.cacheFolder}/${CacheController.eveVersionFileName}`;
        const eveVersion = CacheController.readFileContents(eveVersionFilePath);

        if (!eveVersion) {
            return false;
        }

        if (!eveVersion) {
            return false;
        }

        const result = await CacheController.cacheValid();

        if (!result.eveVersion) {

        }

        if (result.eveVersion !== eveVersion) {
            fs.writeFileSync(`${CacheController.cacheFolder}/${CacheController.eveVersionFileName}`, result.eveVersion);
            logger.info(`Saved new EVE Version: ${result.eveVersion}`);
        }

        return false;
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
