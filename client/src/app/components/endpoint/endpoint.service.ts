import { Injectable }     from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Observable }     from 'rxjs/Observable';
import { xmlToJson } from '../helperfunctions.component';
import { Endpoint } from './endpoint';
import { endpointList } from './endpoints';
// import { Globals } from '../../globals';
import construct = Reflect.construct;
import { Globals } from '../../globals';

@Injectable()
export class EndpointService {

  constructor(private http: Http, private globals: Globals) { }

  // async getEndpoints() {
  //   let result = await this.getEndpointsAPI();
  //   return this.process(result);
  // }

  getEndpoint(name: string): Endpoint {
    return endpointList.filter(_ => _.name === name)[0];
  }

  getCharacterEndpoints(): Array<Endpoint> {
    return endpointList.filter(_ => _.directory === 'char');
  }

  process(result: Object): Array<Endpoint> {
    let endpoints = result['eveapi']['result']['rowset'][1]['row'];
    let corpPoints: Array<Endpoint> = [];
    let characterPoints: Array<Endpoint> = [];
    for (let endpoint of endpoints) {
      if (endpoint['@attributes']) {
        let endpointData = endpoint['@attributes'];
        if (endpointData['type'] === 'Character') {
          characterPoints.push(endpoint);
        } else {
          corpPoints.push(endpoint);
        }
      }
    }
    for (let endpoint of characterPoints) {
      if (endpoint['@attributes']) {
        let endpointData = endpoint['@attributes'];
        let point = endpointList.filter(_ => _.name === endpointData['name'])[0];
        if (point) {
          point.fillData(
            endpointData['accessMask'],
            endpointData['type'],
            endpointData['groupID'],
            endpointData['description']
          );
        }
      }
    }
    return endpointList;
  }

  constructUrl(endpoint: Endpoint, params?: Array<string>): string {
    let url = 'https://api.eveonline.com/';
    url += endpoint.directory;
    url += '/';
    url += endpoint.name;
    url += '.xml.aspx?';
    if (this.globals.activeAccount) {
      url += `keyID=${this.globals.activeAccount.keyID}&vCode=${this.globals.activeAccount.vCode}`;
    }
    if (params) {
      url += `&${params.join('&')}`;
    }
    return url;
  }

  getEndpointsAPI(): Observable<Array<Endpoint>> {
    let url = this.constructUrl(this.getEndpoint('CallList'));
    let headers = new Headers();
    headers.append('Accept', 'application/xml');
    return this.http.get(url, {headers: headers}).map((res: Response) => {
      let data: Object = this.processData(res);
      return this.process(data);
    });
  }

  private processData(res: Response): Object {
    let parser = new DOMParser();
    let xmlData: Document = parser.parseFromString(res['_body'], 'application/xml');
    return xmlToJson(xmlData);
  }
}
