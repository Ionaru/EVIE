import { HttpHeaders, HttpResponse } from '@angular/common/http';

interface ICacheData {
    data: any;
    expiry: string;
    pages?: string;
}

export class ESIRequestCache {

    public static get(identifier: string): HttpResponse<any> | void {
        const cachedDataString = sessionStorage.getItem(identifier) || localStorage.getItem(identifier);
        if (cachedDataString) {

            const cachedData = JSON.parse(cachedDataString) as ICacheData;

            const expiryDate = new Date(cachedData.expiry);
            const now = new Date();

            if (expiryDate > now) {
                return new HttpResponse({
                    body: cachedData.data,
                    headers: new HttpHeaders({'x-pages': cachedData.pages || '1'}),
                });
            }
        }
    }

    public static put(identifier: string, data: any, expiry: string, secureData: boolean, pages?: string) {
        const cacheData: ICacheData = {
            data,
            expiry,
            pages,
        };

        const cachedDataString = JSON.stringify(cacheData);
        secureData ? sessionStorage.setItem(identifier, cachedDataString) : localStorage.setItem(identifier, cachedDataString);
    }
}
