import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { isCacheExpired, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';
import { Observable } from 'rxjs';

@Injectable()
export class RefTypesService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private es: EndpointService) {
    this.endpoint = this.es.getEndpoint('RefTypes');
    this.storageTag = this.endpoint.name;
  }

  getRefTypes(expired: boolean = false): Observable<Object> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      let jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
        return this.getRefTypes(true);
      } else {
        return Observable.of(jsonData);
      }
    } else {
      let url = this.es.constructUrl(this.endpoint, []);
      let headers = new Headers();
      headers.append('Accept', 'application/xml');
      return this.http.get(url, {headers: headers}).map((res) => {
        let jsonData = processXML(res);
        localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
        return jsonData;
      });
    }
  }
}
