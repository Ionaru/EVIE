import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { isCacheExpired, formatISK, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';

@Injectable()
export class JournalService {

  private endpoint: Endpoint;
  private storageTag: string;
  private checkedForJournalBug = false;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('WalletJournal');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  async getJournal(refTypes: Array<Object>, expired = false): Promise<Array<Object>> {
    if (localStorage.getItem(this.storageTag) && !expired) {
      const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
        return await this.getJournal(refTypes, true);
      } else {
        return JournalService.processJournalData(jsonData, refTypes);
      }
    } else {
      const url = this.es.constructXMLUrl(this.endpoint, [
        'rowCount=50'
      ]);
      const headers = new Headers();
      headers.append('Accept', 'application/xml');
      const res = await this.http.get(url, {headers: headers}).toPromise();
      const jsonData = processXML(res);
      if (!this.checkedForJournalBug && localStorage.getItem(this.storageTag)) {
        // The journal XML API has a bug in which the journal data does not get updated even though the cache
        // is expired and new data should be available, this only happens on the first request to the API.
        // To work around this, we'll re-trigger the request one time if the cached data is exactly the same as the
        // new data.
        const oldData = JSON.parse(localStorage.getItem(this.storageTag))['eveapi']['result']['rowset'];
        const newData = jsonData['eveapi']['result']['rowset'];
        if (JSON.stringify(oldData) === JSON.stringify(newData)) {
          this.checkedForJournalBug = true;
          return await this.getJournal(refTypes, true);
        }
      }
      localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
      this.checkedForJournalBug = false;
      return JournalService.processJournalData(jsonData, refTypes);
    }
  }

  private static processJournalData(jsonData: Object, refTypes: Array<Object>): Array<Object> {
    const journalData = [];
    if (jsonData['eveapi']['result']['rowset']['row']) {
      for (const row of jsonData['eveapi']['result']['rowset']['row']) {
        journalData.push({
          date: row['@attributes']['date'],
          refTypeName: refTypes[row['@attributes']['refTypeID']]['@attributes']['refTypeName'],
          ownerName1: row['@attributes']['ownerName1'],
          amount: formatISK(row['@attributes']['amount']),
          balance: formatISK(row['@attributes']['balance']),
        });
      }
    }
    return journalData;
  }
}
