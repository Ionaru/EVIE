import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Globals } from '../shared/globals';
import { Logger } from 'angular2-logger/core';

export interface EveNameData {
  category: string;
  id: number;
  name: string;
}

export interface Names {
  [id: number]: EveNameData;
}

@Injectable()
export class NamesService {

  namesMaxAge = 24 * 60 * 60 * 1000; // 24 hours
  namesStoreTag = 'names';

  constructor(private http: Http, private endpointService: EndpointService, private globals: Globals, private logger: Logger) {
    this.getNamesFromStore();
    if (!globals.names || globals.names instanceof Array) {
      this.resetNames();
    }
  }

  static uniquify(array: Array<any>): Array<any> {
    return array.filter(function (elem, index, self) {
      return index === self.indexOf(elem);
    });
  }

  async getNames(...ids: Array<string | number>): Promise<Names> {

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

    const returnData: Names = {};
    for (const id of ids) {
      returnData[id] = this.globals.names[id];
    }

    this.setNames();
    return returnData;
  }

  async getNamesFromAPI(...ids: Array<string | number>): Promise<void> {
    const url = this.endpointService.constructESIUrl('v2/universe/names');
    let response: Response;
    try {

      response = await this.http.post(url, ids).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
      }

      const names: Array<EveNameData> = response.json();

      for (const name of names) {
        this.globals.names[name.id] = name;
      }

    } catch (err) {
      this.logger.error(err);
      if (response) {
        this.logger.error(response);
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
      if (!storeData || storeData['expiry'] < (Date.now() - this.namesMaxAge)) {
        return this.resetNames();
      }
      this.globals.namesExpiry = storeData['expiry'];
      this.globals.names = storeData['names'];
    } catch (error) {
      this.logger.error(error);
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
