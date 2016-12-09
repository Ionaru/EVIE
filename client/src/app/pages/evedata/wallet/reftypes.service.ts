import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { xmlToJson, isCacheExpired } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';

@Injectable()
export class RefTypesService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('RefTypes');
    this.storageTag = this.endpoint.name + this.globals.activeAccount.keyID + this.globals.selectedCharacter.id;
  }

  // async getRefTypes(expired = false) {
  //   if (!expired && localStorage.getItem(this.storageTag)) {
  //     let jsonData = JSON.parse(localStorage.getItem(this.storageTag));
  //     if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
  //       return this.getRefTypes(true);
  //     } else {
  //       return jsonData;
  //     }
  //   } else {
  //     let url = this.es.constructUrl(this.endpoint, []);
  //     let headers = new Headers();
  //     headers.append('Accept', 'application/xml');
  //     let res = await this.http.get(url, {headers: headers}).toPromise();
  //     let xmlData = this.globals.DOMParser.parseFromString(res['_body'], 'application/xml');
  //     let jsonData = xmlToJson(xmlData);
  //
  //     localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
  //     return jsonData;
  //   }
  // }
}
