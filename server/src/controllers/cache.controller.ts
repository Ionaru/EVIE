import { AxiosResponse } from 'axios';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

interface IResponseCache {
    [index: string]: ICacheObject;
}

interface ICacheObject {
    expiry?: number;
    etag?: string;
    data: any;
}

export class CacheController {

    public static responseCache: IResponseCache = {};

    public static isExpired = (cache: ICacheObject) => cache.expiry ? cache.expiry < Date.now() : true;

    public static dumpCache() {
        const cacheString = JSON.stringify(CacheController.responseCache);
        writeFileSync('data/responseCache.json', cacheString);
    }

    public static saveToCache(response: AxiosResponse) {
        const url = response.config.url;

        if (!url) {
            throw new Error('Unable to save to cache, no URL given');
        }

        if (response.status === httpStatus.OK) {

            if (response.headers.expires || response.headers.etag) {
                CacheController.responseCache[url] = {
                    data: response.data,
                };

                if (response.headers.etag) {
                    CacheController.responseCache[url].etag = response.headers.etag;
                }

                CacheController.responseCache[url].expiry =
                    response.headers.expires ? new Date(response.headers.expires).getTime() : (Date.now() + 300000);
            }

        } else if (response.status === httpStatus.NOT_MODIFIED) {

            CacheController.responseCache[url].expiry =
                response.headers.expires ? new Date(response.headers.expires).getTime() : (Date.now() + 300000);
        }
    }

    public static readCache() {
        if (existsSync('data/responseCache.json')) {
            const cacheString = readFileSync('data/responseCache.json').toString();
            let cacheJson;
            try {
                cacheJson = JSON.parse(cacheString);
            } catch (error) {
                logger.warn(error.message);
            }

            if (cacheJson) {
                CacheController.responseCache = cacheJson;
                logger.info(`${Object.keys(cacheJson).length} cached items loaded into memory`);
            }
        }
    }
}
