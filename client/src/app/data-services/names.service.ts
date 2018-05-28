import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Helpers } from '../shared/helpers';

export interface IESINamesData {
    category: string;
    id: number;
    name: string;
}

export interface INames {
    [id: number]: IESINamesData;
}

@Injectable()
export class NamesService {

    public static getNameFromData(nameData: INames, id: number, unknownMessage: string = 'Unknown'): string {
        if (!nameData || !Object.keys(nameData).length) {
            return unknownMessage;
        }

        if (nameData[id] && nameData[id].name) {
            return nameData[id].name;
        } else {
            return unknownMessage;
        }
    }

    private static names: INames;
    private static namesExpiry: number;
    private static namesMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    private static namesStoreTag = 'names';

    private static resetNames(): void {
        NamesService.namesExpiry = 0;
        NamesService.names = {};
    }

    private static getNamesFromStore(): void {
        try {
            const storeData = JSON.parse(localStorage.getItem(NamesService.namesStoreTag));
            if (storeData.expiry < (Date.now() - NamesService.namesMaxAge)) {
                return NamesService.resetNames();
            }
            NamesService.namesExpiry = storeData.expiry;
            NamesService.names = storeData.names;
        } catch (error) {
            // An error happened while getting the Names from localStorage, this can have a number of reasons but a reset will fix all.
            return NamesService.resetNames();
        }
    }

    private static setNames() {
        if (!NamesService.namesExpiry) {
            NamesService.namesExpiry = Date.now() + NamesService.namesMaxAge;
        }
        localStorage.setItem(NamesService.namesStoreTag, JSON.stringify({expiry: NamesService.namesExpiry, names: NamesService.names}));
    }

    private static uniquifyArray(array: any[]): any[] {
        return array.filter((elem, index, self) => {
            return index === self.indexOf(elem);
        });
    }

    constructor(private http: HttpClient) {
        NamesService.getNamesFromStore();
    }

    public async getNames(...ids: Array<string | number>): Promise<INames> {

        ids = NamesService.uniquifyArray(ids);

        // Check if all values in 'ids' are -1, if so then there's no point in calling the Names Endpoint
        if (ids.every((element) => element === -1)) {
            return [];
        }

        const namesToGet: Array<string | number> = [];

        for (const id of ids) {
            if (!NamesService.names[id]) {
                namesToGet.push(id);
            }
        }

        if (namesToGet.length) {
            const maxChunkSize = 1000;
            for (let i = 0, j = namesToGet.length; i < j; i += 1000) {
                const namesToGetChunk = namesToGet.slice(i, i + maxChunkSize);
                await this.getNamesFromAPI(namesToGetChunk);
            }
        }

        const returnData: INames = {};
        for (const id of ids) {
            returnData[id] = NamesService.names[id];
        }

        NamesService.setNames();
        return returnData;
    }

    private async getNamesFromAPI(ids: Array<string | number>): Promise<void> {
        const url = Helpers.constructESIUrl(2, 'universe/names');
        const response = await this.http.post<any>(url, ids).toPromise<IESINamesData[]>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        for (const name of response) {
            NamesService.names[name.id] = name;
        }
    }
}
