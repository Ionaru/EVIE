import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { isCacheExpired, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';
import { Observable } from 'rxjs';

@Injectable()
export class BalanceService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('AccountBalance');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  getBalance(expired: boolean = false): Observable<string> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      let jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
        return this.getBalance(true);
      } else {
        return Observable.of(BalanceService.processBalance(jsonData));
      }
    } else {
      let url = this.es.constructXMLUrl(this.endpoint, []);
      let headers = new Headers();
      headers.append('Accept', 'application/xml');
      return this.http.get(url, {headers: headers}).map((res) => {
        let jsonData = processXML(res);
        localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
        return BalanceService.processBalance(jsonData);
      });
    }
  }

  private static processBalance(jsonData: Object): string {
    return jsonData['eveapi']['result']['rowset']['row']['@attributes']['balance'];
  }
}
