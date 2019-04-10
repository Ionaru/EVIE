import { HttpResponse } from '@angular/common/http';

interface ICacheData {
    data: any;
    expiry: string;
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
                });
            }
        }
    }

    public static put(identifier: string, data: any, expiry: string, secureData: boolean) {
        const cacheData: ICacheData = {
            data,
            expiry,
        };

        const cachedDataString = JSON.stringify(cacheData);
        secureData ? sessionStorage.setItem(identifier, cachedDataString) : localStorage.setItem(identifier, cachedDataString);
    }
}
