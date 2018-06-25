import { HttpResponse } from '@angular/common/http';

interface ICacheData {
    data: any;
    expiry: string;
}

export class ESIRequestCache {

    public static get(identifier: string): HttpResponse<any> | undefined {
        const cachedDataString = sessionStorage.getItem(identifier);
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

    public static put(identifier: string, data: any, expiry: string): void {
        const cacheData: ICacheData = {
            data,
            expiry,
        };

        const cachedDataString = JSON.stringify(cacheData);
        sessionStorage.setItem(identifier, cachedDataString);
    }
}
