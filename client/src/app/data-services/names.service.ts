import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../shared/eve';

export interface IESINamesData {
    category: string;
    id: number;
    name: string;
}

export interface INames {
    [id: string]: IESINamesData;
}

@Injectable()
export class NamesService {

    public static getNameFromData(id: number, unknownMessage = 'Unknown'): string {
        if (!NamesService.names || !Object.keys(NamesService.names).length) {
            return unknownMessage;
        }

        if (NamesService.names[id] && NamesService.names[id].name) {
            return NamesService.names[id].name;
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

        const storeData = localStorage.getItem(NamesService.namesStoreTag);
        if (!storeData) {
            return NamesService.resetNames();
        }

        try {
            const storeJSON = JSON.parse(storeData);
            if (storeJSON.expiry < (Date.now() - NamesService.namesMaxAge)) {
                return NamesService.resetNames();
            }
            NamesService.namesExpiry = storeJSON.expiry;
            NamesService.names = storeJSON.names;
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

    public async getNames(...ids: Array<string | number>): Promise<void> {

        ids = NamesService.uniquifyArray(ids);

        // Check if all values in 'ids' are -1, if so then there's no point in calling the Names Endpoint
        if (ids.every((element) => element === -1)) {
            return;
        }

        const namesToGet: Array<string | number> = [];

        for (const id of ids) {
            if (!NamesService.names[id]) {
                namesToGet.push(id);
            }
        }

        if (namesToGet.length) {
            const maxChunkSize = 1000;
            while (true) {
                const namesToGetChunk = namesToGet.splice(0, maxChunkSize);

                if (namesToGetChunk.length > 0) {
                    await this.getNamesFromAPI(namesToGetChunk);
                }

                if (namesToGetChunk.length < 1000) {
                    break;
                }
            }
        }

        NamesService.setNames();
    }

    private async getNamesFromAPI(ids: Array<string | number>): Promise<void> {
        const url = EVE.constructESIURL(2, 'universe/names');
        const response = await this.http.post<any>(url, ids).toPromise<IESINamesData[]>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        for (const name of response) {
            NamesService.names[name.id] = name;
        }
    }
}
