import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { isCacheExpired, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';

@Injectable()
export class BalanceService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('AccountBalance');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  async getBalance(expired = false): Promise<string> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
        return this.getBalance(true);
      } else {
        return this.processBalance(jsonData);
      }
    } else {
      localStorage.removeItem(this.storageTag);
      try {
        const url = this.es.constructXMLUrl(this.endpoint, []);
        const headers = new Headers();
        headers.append('Accept', 'application/xml');
        const res = await this.http.get(url, {headers: headers}).toPromise();
        const jsonData = processXML(res);
        localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
        return this.processBalance(jsonData);
      } catch (error) {
        return this.handleBalanceError(error);
      }
    }
  }

  private processBalance(jsonData: Object): string {
    try {
      return jsonData['eveapi']['result']['rowset']['row']['@attributes']['balance'];
    } catch (error) {
      return this.handleBalanceError(error);
    }
  }

  private handleBalanceError(error: Error): string {
    console.error(error);
    localStorage.removeItem(this.storageTag);
    return 'Error';
  }
}
