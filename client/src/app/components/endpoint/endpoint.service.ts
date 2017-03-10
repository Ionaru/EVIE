import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Endpoint } from './endpoint';
import { endpointList } from './endpoints';
import { Globals } from '../../globals';
import * as assert from 'assert';

export interface EveNameData {
  category: string;
  id: number;
  name: string;
}

@Injectable()
export class EndpointService {

  XMLBaseUrl = 'https://api.eveonline.com/';
  ESIBaseUrl = 'https://esi.tech.ccp.is/';

  constructor(private globals: Globals, private http: Http) { }

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
    const url = this.constructESIUrl('v2/universe/names');
    try {
      const response: Response = await this.http.post(url, ids).toPromise();
      assert.equal(response.status, 200, `Request to ${url} returned ${response.status} instead of expected 200`);
      return response.json();
    } catch (err) {
      return [];
    }
  }

  getNameFromNameData(nameData, item): string {
    try {
      return nameData.filter(_ => _.id === item)[0].name;
    } catch (err) {
      return 'Error';
    }
  }
}
