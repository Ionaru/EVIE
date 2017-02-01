import { Injectable }     from '@angular/core';
import { Endpoint } from './endpoint';
import { endpointList } from './endpoints';
import { Globals } from '../../globals';

@Injectable()
export class EndpointService {

  XMLBaseUrl: string = 'https://api.eveonline.com/';
  ESIBaseUrl: string = 'https://esi.tech.ccp.is/';

  constructor(private globals: Globals) { }

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
    for (let param of params) {
      url += param + '/';
    }
    url += '?datasource=tranquility';
    return url;
  }
}
