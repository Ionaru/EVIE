import { Injectable } from '@angular/core';
import { Endpoint } from './endpoint';
import { endpointList } from './endpoints';
import { Globals } from '../../globals';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

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
      url += `accessToken=${this.globals.selectedCharacter.accessToken}`;
    }
    if (params) {
      url += `&${params.join('&')}`;
    }
    return url;
  }

  constructESIUrl(...params: Array<string | number>): string {
    let url = this.ESIBaseUrl;
    url += params.join('/');
    url += '/';
    return url;
  }

  getNames(...ids: Array<string | number>) {
    const url = this.constructESIUrl('v2/universe/names');
    return this.http.post(url, ids).map((response: Response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error();
      }
    }).retry(1).catch(() => {
      const response = [];
      return Observable.of(response);
    });
  }
}
