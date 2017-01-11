import { Injectable }     from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Observable }     from 'rxjs/Observable';
import { processXML } from '../helperfunctions.component';
import { Endpoint } from './endpoint';
import { endpointList } from './endpoints';
import { Globals } from '../../globals';

@Injectable()
export class EndpointService {

  ESI: Object;
  XML: Object;

  constructor(private http: Http, private globals: Globals) { }

  // async getEndpoints() {
  //   let result = await this.getXMLAPI();
  //   return this.process(result);
  // }

  getEndpoint(name: string): Endpoint {
    return endpointList.filter(_ => _.name === name)[0];
  }

  getCharacterEndpoints(): Array<Endpoint> {
    return endpointList.filter(_ => _.directory === 'char');
  }

  getXMLAPI(): Observable<Array<Endpoint>> {
    let url = this.constructXMLUrl(this.getEndpoint('CallList'));
    let headers = new Headers();
    headers.append('Accept', 'application/xml');
    return this.http.get(url, {headers: headers}).map((res: Response) => {
      this.XML = processXML(res);
      return this.processXMLAPI(this.XML);
    });
  }

  processXMLAPI(result: Object): Array<Endpoint> {
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

  constructXMLUrl(endpoint: Endpoint, params?: Array<string>): string {
    let url = 'https://api.eveonline.com/';
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

  getESIAPI(): Observable<any> {
    let url = 'https://esi.tech.ccp.is/latest/swagger.json?datasource=tranquility';
    return this.http.get(url).map((res: Response) => {
      this.ESI = JSON.parse(res['_body']);
      return this.getESI();
    });
  }

  getESI(): Object {
    return this.ESI;
  }

  getESIEndpoint(searchFor: string): Object {
    // Get all paths from the ESI
    let paths: Object = this.getESI()['paths'];

    for (let path in paths) {
      if (paths.hasOwnProperty(path)) {

        let pathValue: Object = paths[path];

        for (let method in pathValue) {
          if (pathValue.hasOwnProperty(method)) {

            let methodValue: Object = pathValue[method];
            if (methodValue['operationId'] === searchFor) {
              return paths[path];
            }
          }
        }
      }
    }
  }
}
