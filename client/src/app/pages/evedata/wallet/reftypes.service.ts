import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { isCacheExpired, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Endpoint } from '../../../components/endpoint/endpoint';

@Injectable()
export class RefTypesService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private es: EndpointService) {
    this.endpoint = this.es.getEndpoint('RefTypes');
    this.storageTag = this.endpoint.name;
  }

  async getRefTypes(expired = false): Promise<Object> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil'][0])) {
        return this.getRefTypes(true);
      } else {
        return jsonData;
      }
    } else {
      const url = this.es.constructXMLUrl(this.endpoint, []);
      const headers = new Headers();
      headers.append('Accept', 'application/xml');
      const res = await this.http.get(url, {headers: headers}).toPromise();
      const jsonData = processXML(res);
      localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
      return jsonData;
    }
  }
}
