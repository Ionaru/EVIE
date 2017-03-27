import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { isCacheExpired, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';
import { Logger } from 'angular2-logger/core';

@Injectable()
export class BalanceService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private logger: Logger, private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('AccountBalance');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  async getBalance(expired = false): Promise<string> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil'][0])) {
        return this.getBalance(true);
      } else {
        return jsonData['eveapi']['result'][0]['rowset'][0]['row'][0]['$']['balance'];
      }
    } else {
      localStorage.removeItem(this.storageTag);
      const url = this.es.constructXMLUrl(this.endpoint, []);
      const headers = new Headers();
      headers.append('Accept', 'application/xml');
      let response: Response;
      try {
        response = await this.http.get(url, {headers: headers}).toPromise().catch((errorResponse) => {
          response = errorResponse;
          throw new Error();
        });
        const jsonData = processXML(response);
        localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
        return jsonData['eveapi']['result'][0]['rowset'][0]['row'][0]['$']['balance'];
      } catch (err) {
        if (response) {
          this.logger.error(response);
        }
        this.logger.error(err);
        localStorage.removeItem(this.storageTag);
        return 'Error';
      }
    }
  }
}
