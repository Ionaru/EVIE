import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Helpers } from '../shared/helpers';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Endpoint } from '../models/endpoint/endpoint.model';

@Injectable()
export class RefTypesService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private endpointService: EndpointService, private helpers: Helpers) {
    this.endpoint = this.endpointService.getEndpoint('RefTypes');
    this.storageTag = this.endpoint.name;
  }

  async getRefTypes(expired = false): Promise<Object> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (this.helpers.isCacheExpired(jsonData['eveapi']['cachedUntil'][0])) {
        return this.getRefTypes(true);
      } else {
        return jsonData;
      }
    } else {
      localStorage.removeItem(this.storageTag);
      const url = this.endpointService.constructXMLUrl(this.endpoint, []);
      const headers = new Headers();
      headers.append('Accept', 'application/xml');
      const res = await this.http.get(url, {headers: headers}).toPromise();
      const jsonData = this.helpers.processXML(res);
      localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
      return jsonData;
    }
  }
}
