import { Injectable } from '@angular/core';
import { Http, RequestOptionsArgs, Response } from '@angular/http';
import { Endpoint } from './endpoint';
import { endpointList } from './endpoints';
import { Globals } from '../../globals';
import * as assert from 'assert';
import { Logger } from 'angular2-logger/core';

export interface EveNameData {
  category: string;
  id: number;
  name: string;
}

@Injectable()
export class EndpointService {

  XMLBaseUrl = 'https://api.eveonline.com/';
  ESIBaseUrl = 'https://esi.tech.ccp.is/';

  constructor(private logger: Logger, private globals: Globals, private http: Http) { }

  getEndpoint(name: string): Endpoint {
    return endpointList.filter(_ => _.name === name)[0];
  }

  constructXMLUrl(endpoint: Endpoint, params?: Array<string>): string {
    let url = this.XMLBaseUrl;
    url += endpoint.directory;
    url += '/';
    url += endpoint.name;
    url += '.xml.aspx?';
    if (this.globals.selectedCharacter) {
      url += `accessToken=${this.globals.selectedCharacter.accessToken}&`;
    }
    if (params) {
      url += `${params.join('&')}`;
    }
    return url;
  }

  constructESIUrl(...params: Array<string | number>): string {
    let url = this.ESIBaseUrl;
    url += params.join('/');
    url += '/';
    return url;
  }

  async getNames(...ids: Array<string | number>): Promise<Array<EveNameData>> {

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

  getNameFromNameData(nameData, item): string {
    try {
      return nameData.filter(_ => _.id === item)[0].name;
    } catch (err) {
      return 'Error';
    }
  }

  async httpPost(url: string, body: any, options?: RequestOptionsArgs): Promise<Response> {
    return this.http.post(url, body, options).toPromise().catch((errorResponse) => {
      return errorResponse;
    });
  }
}
