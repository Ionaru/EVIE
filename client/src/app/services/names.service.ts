import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
// import { Logger } from 'angular2-logger/core';

import { EndpointService } from '../models/endpoint/endpoint.service';
import { Globals } from '../shared/globals';

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

  private namesMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  private namesStoreTag = 'names';

  constructor(private http: Http, private endpointService: EndpointService, private globals: Globals /*, private logger: Logger */) {
    this.getNamesFromStore();
    if (!globals.names || globals.names instanceof Array) {
      this.resetNames();
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
      if (!this.globals.names[id]) {
        namesToGet.push(id);
      }
    }

    if (namesToGet.length) {
      await this.getNamesFromAPI(...namesToGet);
    }

    const returnData: INames = {};
    for (const id of ids) {
      returnData[id] = this.globals.names[id];
    }

    this.setNames();
    return returnData;
  }

  private async getNamesFromAPI(...ids: Array<string | number>): Promise<void> {
    const url = this.endpointService.constructESIUrl('v2/universe/names');
    let response: Response;
    try {

      response = await this.http.post(url, ids).toPromise().catch((error) => {
        // this.logger.error('Response error', error);
        return error;
      });

      if (!response.ok || response.status !== 200) {
        // this.logger.error('Response was not OK', response);
        return;
      }

      const names: IEveNameData[] = response.json();

      for (const name of names) {
        this.globals.names[name.id] = name;
      }

    } catch (err) {
      // this.logger.error(err);
      if (response) {
        // this.logger.error(response);
      }
    }
  }

  private resetNames(): void {
    this.globals.namesExpiry = 0;
    this.globals.names = {};
  }

  private getNamesFromStore(): void {
    try {
      const storeData = JSON.parse(localStorage.getItem(this.namesStoreTag));
      if (!storeData || storeData.expiry < (Date.now() - this.namesMaxAge)) {
        return this.resetNames();
      }
      this.globals.namesExpiry = storeData.expiry;
      this.globals.names = storeData.names;
    } catch (error) {
      // this.logger.error(error);
      return this.resetNames();
    }
  }

  private setNames() {
    if (!this.globals.namesExpiry) {
      this.globals.namesExpiry = Date.now() + this.namesMaxAge;
    }
    localStorage.setItem(this.namesStoreTag, JSON.stringify({expiry: this.globals.namesExpiry, names: this.globals.names}));
  }
}
