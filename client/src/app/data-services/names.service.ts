import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EndpointService } from '../models/endpoint/endpoint.service';

export interface IEveNameData {
    category: string;
    id: number;
    name: string;
}

export interface INames {
    [id: number]: IEveNameData;
}

@Injectable()
export class NamesService {

    public static names: INames;
    public static namesExpiry: number;

    private namesMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    private namesStoreTag = 'names';

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

    private static uniquify(array: any[]): any[] {
        return array.filter((elem, index, self) => {
            return index === self.indexOf(elem);
        });
    }

    private static resetNames(): void {
        NamesService.namesExpiry = 0;
        NamesService.names = {};
    }

    constructor(private http: HttpClient, private endpointService: EndpointService) {
        this.getNamesFromStore();
        if (!NamesService.names || NamesService.names instanceof Array) {
            NamesService.resetNames();
        }
    }

    public async getNames(...ids: Array<string | number>): Promise<INames> {

        ids = NamesService.uniquify(ids);

        // Check if all values in 'ids' are -1, if so then there's no point in calling the Names Endpoint
        const allErrors = ids.every((element) => {
            return element === -1;
        });
        if (allErrors) {
            return [];
        }

        const namesToGet: Array<string | number> = [];

        for (const id of ids) {
            if (!NamesService.names[id]) {
                namesToGet.push(id);
            }
        }

        if (namesToGet.length) {
            await this.getNamesFromAPI(...namesToGet);
        }

        const returnData: INames = {};
        for (const id of ids) {
            returnData[id] = NamesService.names[id];
        }

        this.setNames();
        return returnData;
    }

    private async getNamesFromAPI(...ids: Array<string | number>): Promise<void> {
        const url = this.endpointService.constructESIUrl(2, 'universe/names');
        const response = await this.http.post<any>(url, ids).toPromise<IEveNameData[]>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        for (const name of response) {
            NamesService.names[name.id] = name;
        }
    }

    private getNamesFromStore(): void {
        try {
            const storeData = JSON.parse(localStorage.getItem(this.namesStoreTag));
            if (!storeData || storeData.expiry < (Date.now() - this.namesMaxAge)) {
                return NamesService.resetNames();
            }
            NamesService.namesExpiry = storeData.expiry;
            NamesService.names = storeData.names;
        } catch (error) {
            return NamesService.resetNames();
        }
    }

    private setNames() {
        if (!NamesService.namesExpiry) {
            NamesService.namesExpiry = Date.now() + this.namesMaxAge;
        }
        localStorage.setItem(this.namesStoreTag, JSON.stringify({expiry: NamesService.namesExpiry, names: NamesService.names}));
    }
}
