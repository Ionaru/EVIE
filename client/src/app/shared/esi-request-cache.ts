import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BaseService } from '../data-services/base.service';

interface ICache {
    [identifier: string]: ICacheData | undefined;
}

interface ICacheData {
    data: any;
    expiry: string;
    pages?: string;
}

@Injectable()
export class ESIRequestCache {

    private static cache: ICache = {};

    public static get(identifier: string): HttpResponse<any> | void {

        const cachedData = ESIRequestCache.cache[identifier];

        if (cachedData) {

            const expiryDate = new Date(cachedData.expiry);
            const now = new Date();

            if (expiryDate > now) {
                return new HttpResponse({
                    body: cachedData.data,
                    headers: new HttpHeaders().set(BaseService.pagesHeaderName, cachedData.pages || '1'),
                });
            }
        }
    }

    public static put(identifier: string, data: any, expiry: string, pages?: string) {
        ESIRequestCache.cache[identifier] = {
            data,
            expiry,
            pages,
        };
    }
}
