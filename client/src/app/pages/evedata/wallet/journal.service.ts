import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { isCacheExpired, formatISK, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';
import { Observable } from 'rxjs';

@Injectable()
export class JournalService {

  private endpoint: Endpoint;
  private storageTag: string;
  private refTypes: Object;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('WalletJournal');
    this.storageTag = this.endpoint.name + this.globals.activeAccount.keyID + this.globals.selectedCharacter.id;
  }

  getJournal(refTypes, expired = false): Observable<Array<Object>> {
    this.refTypes = refTypes['eveapi']['result']['rowset']['row'];
    if (localStorage.getItem(this.storageTag) && !expired) {
      let jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
        return this.getJournal(refTypes, true);
      } else {
        return Observable.of(JournalService.processJournalData(jsonData, refTypes));
      }
    } else {
      let url = this.es.constructUrl(this.endpoint, [
        'characterID=' + this.globals.selectedCharacter.id,
        'rowCount=50'
      ]);
      let headers = new Headers();
      headers.append('Accept', 'application/xml');
      return this.http.get(url, {headers: headers}).map((res) => {
        let jsonData = processXML(res);
        localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
        return JournalService.processJournalData(jsonData, refTypes);
      });
    }
  }

  private static processJournalData(jsonData: Object, refTypes: Object): Array<Object> {
    let journalData = [];
    for (let row of jsonData['eveapi']['result']['rowset']['row']) {
      journalData.push({
        date: row['@attributes']['date'],
        refTypeName: refTypes[row['@attributes']['refTypeID']]['@attributes']['refTypeName'],
        ownerName1: row['@attributes']['ownerName1'],
        amount: formatISK(row['@attributes']['amount']),
        balance: formatISK(row['@attributes']['balance']),
      });
    }
    return journalData;
  }
}
