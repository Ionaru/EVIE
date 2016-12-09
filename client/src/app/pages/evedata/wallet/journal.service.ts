import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { xmlToJson, isCacheExpired, formatISK } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';

@Injectable()
export class JournalService {

  private endpoint: Endpoint;
  private storageTag: string;
  private refTypes: Object;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('WalletJournal');
    this.storageTag = this.endpoint.name + this.globals.activeAccount.keyID + this.globals.selectedCharacter.id;
  }

  // async getJournal(refTypes, expired = false) {
  //   this.refTypes = refTypes['eveapi']['result']['rowset']['row'];
  //   if (localStorage.getItem(this.storageTag) && !expired) {
  //     let jsonData = JSON.parse(localStorage.getItem(this.storageTag));
  //     if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
  //       return this.getJournal(refTypes, true);
  //     } else {
  //       return this.processJournalData(jsonData);
  //     }
  //   } else {
  //     let url = this.es.constructUrl(this.endpoint, [
  //       'characterID=' + this.globals.selectedCharacter.id,
  //       'rowCount=50'
  //     ]);
  //     let headers = new Headers();
  //     headers.append('Accept', 'application/xml');
  //     let res = await this.http.get(url, {headers: headers}).toPromise();
  //     let xmlData = this.globals.DOMParser.parseFromString(res['_body'], 'application/xml');
  //     let jsonData = xmlToJson(xmlData);
  //     localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
  //     return this.processJournalData(jsonData);
  //   }
  // }

  private processJournalData(jsonData: Object): Array<Object> {
    let journalData = [];
    for (let row of jsonData['eveapi']['result']['rowset']['row']) {
      journalData.push({
        date: row['@attributes']['date'],
        refTypeID: this.refTypes[row['@attributes']['refTypeID']]['@attributes']['refTypeName'],
        ownerName1: row['@attributes']['ownerName1'],
        amount: formatISK(row['@attributes']['amount']),
        balance: formatISK(row['@attributes']['balance']),
      });
    }
    return journalData;
  }
}
