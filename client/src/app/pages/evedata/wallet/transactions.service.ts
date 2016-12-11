import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { isCacheExpired, formatISK, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';
import { Observable } from 'rxjs';

@Injectable()
export class TransactionService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('WalletTransactions');
    this.storageTag = this.endpoint.name + this.globals.activeAccount.keyID + this.globals.selectedCharacter.id;
  }

  getTransactions(expired: boolean = false): Observable<Array<Object>> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      let jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
        return this.getTransactions(true);
      } else {
        return Observable.of(TransactionService.processTransactionData(jsonData));
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
        return TransactionService.processTransactionData(jsonData);
      });
    }
  }

  private static processTransactionData(jsonData: Object): Array<Object> {
    let transactionData = [];
    for (let row of jsonData['eveapi']['result']['rowset']['row']) {
      let date = row['@attributes']['transactionDateTime'];
      let ppi = row['@attributes']['price'];
      let quantity = row['@attributes']['quantity'];
      let typeName = row['@attributes']['typeName'];
      let typeID = row['@attributes']['typeID'];
      let clientName = row['@attributes']['clientName'];
      let clientID = row['@attributes']['clientID'];
      let transactionType = row['@attributes']['transactionType'];
      let transactionID = row['@attributes']['transactionID'];
      transactionData.push({
        date: date,
        price: formatISK(ppi * quantity),
        quantity: quantity,
        transactionType: transactionType,
        transactionID: transactionID,
        ppi: formatISK(ppi),
        typeName: typeName,
        typeID: typeID,
        clientName: clientName,
        clientID: clientID,
      });
    }
    return transactionData;
  }
}
