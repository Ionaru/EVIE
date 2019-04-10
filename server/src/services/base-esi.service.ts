import { AxiosError, AxiosRequestConfig } from 'axios';
import * as httpStatus from 'http-status-codes';
import { logger } from 'winston-pnp-logger';

import { CacheController } from '../controllers/cache.controller';
import { Configurator } from '../controllers/configuration.controller';
import { RequestLogger } from '../loggers/request.logger';

export class BaseESIService {

    public static async fetchESIData<T>(url: string): Promise<T | undefined> {

        if (CacheController.responseCache[url] && !CacheController.isExpired(CacheController.responseCache[url])) {
            return CacheController.responseCache[url].data as T;
        }

        const requestConfig: AxiosRequestConfig = {
            // Make sure 304 responses are not treated as errors.
            validateStatus: (status) => status === httpStatus.OK || status === httpStatus.NOT_MODIFIED,
        };

        if (CacheController.responseCache[url] && CacheController.responseCache[url].etag) {
            requestConfig.headers = {
                'If-None-Match': `${CacheController.responseCache[url].etag}`,
            };
        }

        const response = await Configurator.axios.get<T | undefined>(url, requestConfig).catch((error: AxiosError) => {
            logger.error('Request failed:', url, error.message);
            return undefined;
        });

        if (response) {
            logger.debug(`${url} => ${RequestLogger.getStatusColor(response.status)(`${response.status} ${response.statusText}`)}`);
            if (response.status === httpStatus.OK || response.status === httpStatus.NOT_MODIFIED) {

                CacheController.saveToCache(response);

                if (response.headers.warning) {
                    BaseESIService.logWarning(url, response.headers.warning);
                }

                return response.data || CacheController.responseCache[url].data as T;
            } else {
                logger.error('Request not OK:', url, response.status, response.statusText, response.data);
            }
        }

        return;
    }

    public static logWarning(route: string, text?: string) {
        if (!BaseESIService.deprecationsLogged.includes(route)) {
            logger.warn('HTTP request warning:', route, text);
            BaseESIService.deprecationsLogged.push(route);
        }
    }

    private static deprecationsLogged: string[] = [];
}
