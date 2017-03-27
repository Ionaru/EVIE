import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Helpers } from '../shared/helpers';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Globals } from '../shared/globals';
import { Endpoint } from '../models/endpoint/endpoint.model';
import { Logger } from 'angular2-logger/core';
import * as assert from 'assert';

@Injectable()
export class BalanceService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private logger: Logger,
              private http: Http,
              private endpointService: EndpointService,
              private globals: Globals,
              private helpers: Helpers) {
    this.endpoint = this.endpointService.getEndpoint('AccountBalance');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  async getBalance(expired = false): Promise<string> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (this.helpers.isCacheExpired(jsonData['eveapi']['cachedUntil'][0])) {
        return this.getBalance(true);
      } else {
        return jsonData['eveapi']['result'][0]['rowset'][0]['row'][0]['$']['balance'];
      }
    } else {
      localStorage.removeItem(this.storageTag);
      const url = this.endpointService.constructXMLUrl(this.endpoint, []);
      const headers = new Headers();
      headers.append('Accept', 'application/xml');
      const response = await this.http.get(url, {headers: headers}).toPromise();
      try {
        assert.ok(response.ok, `Request to ${url} returned ${response.status} instead of expected 200`);
        const jsonData = this.helpers.processXML(response);
        localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
        return jsonData['eveapi']['result'][0]['rowset'][0]['row'][0]['$']['balance'];
      } catch (err) {
        this.logger.error(response);
        this.logger.error(err);
        localStorage.removeItem(this.storageTag);
        return 'Error';
      }
    }
  }
}
