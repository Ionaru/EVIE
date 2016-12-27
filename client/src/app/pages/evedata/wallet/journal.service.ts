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
  private checkedForJournalBug: boolean = false;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('WalletJournal');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.id;
  }

  getJournal(refTypes: Array<Object>, expired: boolean = false): Observable<Array<Object>> {
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
      return this.http.get(url, {headers: headers}).map(res => {
        let jsonData = processXML(res);

        if (!this.checkedForJournalBug && localStorage.getItem(this.storageTag)) {
          // The journal XML API contains a bug in which the journal data does not get updated even though the cache
          // is expired and new data should be available, this only happens on the first request to the API.
          // To work around this, we'll re-trigger the request one time if the cached data is exactly the same as the
          // new data.
          let oldData = JSON.parse(localStorage.getItem(this.storageTag))['eveapi']['result']['rowset'];
          let newData = jsonData['eveapi']['result']['rowset'];
          if (JSON.stringify(oldData) === JSON.stringify(newData)) {
            this.checkedForJournalBug = true;
            throw new Error('');
          }
        }

        localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
        this.checkedForJournalBug = false;
        return JournalService.processJournalData(jsonData, refTypes);
      }).retryWhen(errors => {
        return errors.scan(() => {
          return this.checkedForJournalBug;
        }).delay(500);
      });
    }
  }

  private static processJournalData(jsonData: Object, refTypes: Array<Object>): Array<Object> {
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
