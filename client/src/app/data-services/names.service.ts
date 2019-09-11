import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { uniquifyArray } from '@ionaru/array-utils';
import { EVE, IUniverseNamesData, IUniverseNamesDataUnit } from '@ionaru/eve-utils';

import { Calc } from '../../shared/calc.helper';
import { BaseService } from './base.service';

export interface INames {
    [id: string]: IUniverseNamesDataUnit;
}

@Injectable()
export class NamesService extends BaseService {

    public static getNameFromData(id: number, unknownMessage = 'Unknown'): string {
        if (!NamesService.names || !Object.entries(NamesService.names).length) {
            return unknownMessage;
        }

        if (NamesService.names[id] && NamesService.names[id].name) {
            return NamesService.names[id].name;
        } else {
            return unknownMessage;
        }
    }

    public static getNamesFromStore(): void {

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

    private static names: INames;
    private static namesExpiry: number;
    private static namesMaxAge = 604_800_000; // 7 days
    private static namesStoreTag = 'names';

    private static resetNames(): void {
        NamesService.namesExpiry = 0;
        NamesService.names = {};
    }

    private static setNames() {
        if (!NamesService.namesExpiry) {
            NamesService.namesExpiry = Date.now() + NamesService.namesMaxAge;
        }
        localStorage.setItem(NamesService.namesStoreTag, JSON.stringify({expiry: NamesService.namesExpiry, names: NamesService.names}));
    }

    public async getNames(...ids: Array<string | number>): Promise<void> {

        ids = uniquifyArray(ids);

        for (const element of ids) {
            if (element > Calc.maxIntegerValue) {
                throw new Error(`${element} is not a value that can get resolved to a name.`);
            }
        }

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

        if (!namesToGet.length) {
            return;
        }

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

        NamesService.setNames();
    }

    private async getNamesFromAPI(ids: Array<string | number>): Promise<void> {
        const url = EVE.getUniverseNamesUrl();
        const response = await this.http.post<any>(url, ids).toPromise<IUniverseNamesData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        for (const name of response) {
            NamesService.names[name.id] = name;
        }
    }
}
