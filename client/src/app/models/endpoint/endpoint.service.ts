import { Injectable } from '@angular/core';
import { Http, RequestOptionsArgs, Response } from '@angular/http';
import { Logger } from 'angular2-logger/core';
import * as assert from 'assert';

import { Globals } from '../../shared/globals';
import { Endpoint } from './endpoint.model';
import { endpointList } from './endpoints';

export interface IEveNameData {
  category: string;
  id: number;
  name: string;
}

@Injectable()
export class EndpointService {

  public xmlBaseUrl = 'https://api.eveonline.com/';
  public esiBaseUrl = 'https://esi.tech.ccp.is/';

  constructor(private logger: Logger, private globals: Globals, private http: Http) { }

  public getEndpoint(name: string): Endpoint {
    return endpointList.filter((_) => _.name === name)[0];
  }

  public constructXMLUrl(endpoint: Endpoint, params?: string[], authentication = true): string {
    let url = this.xmlBaseUrl;
    url += endpoint.directory;
    url += '/';
    url += endpoint.name;
    url += '.xml.aspx?';
    if (authentication && this.globals.selectedCharacter) {
      url += `accessToken=${this.globals.selectedCharacter.accessToken}&`;
    }
    if (params && params.length) {
      url += `${params.join('&')}`;
    }
    return url;
  }

  public constructESIUrl(...params: Array<string | number>): string {
    let url = this.esiBaseUrl;
    url += params.join('/');
    url += '/';
    return url;
  }

  /** @deprecated use NamesService instead */
  public async getNames(...ids: Array<string | number>): Promise<IEveNameData[]> {

    // Check if all values in 'ids' are -1, if so then there's no point in calling the Names Endpoint
    const allErrors = ids.every((element) => {
      return element === -1;
    });

    if (!allErrors) {
      const url = this.constructESIUrl('v2/universe/names');
      let response: Response;
      try {
        response = await this.httpPost(url, ids);
        assert.equal(response.status, 200, `Request to ${url} returned ${response.status} instead of expected 200`);
        return response.json();
      } catch (err) {
        this.logger.error(err);
        if (response) {
          this.logger.error(response);
        }
      }
    }
    return [];
  }

  public getNameFromNameData(nameData, item): string {
    try {
      return nameData.filter((_) => _.id === item)[0].name;
    } catch (err) {
      return 'Error';
    }
  }

  public async httpPost(url: string, body: any, options?: RequestOptionsArgs): Promise<Response> {
    return this.http.post(url, body, options).toPromise();
  }
}
