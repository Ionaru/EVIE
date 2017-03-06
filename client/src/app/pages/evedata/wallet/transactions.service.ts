import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { isCacheExpired, formatISK, processXML } from '../../../components/helperfunctions.component';
import { EndpointService } from '../../../components/endpoint/endpoint.service';
import { Globals } from '../../../globals';
import { Endpoint } from '../../../components/endpoint/endpoint';

@Injectable()
export class TransactionService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
    this.endpoint = this.es.getEndpoint('WalletTransactions');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  async getTransactions(expired = false): Promise<Array<Object>> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (isCacheExpired(jsonData['eveapi']['cachedUntil']['#text'])) {
        return this.getTransactions(true);
      } else {
        return TransactionService.processTransactionData(jsonData);
      }
    } else {
      const url = this.es.constructXMLUrl(this.endpoint, [
        'rowCount=50'
      ]);
      const headers = new Headers();
      headers.append('Accept', 'application/xml');
      const res = await this.http.get(url, {headers: headers}).toPromise();
      const jsonData = processXML(res);
      localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
      return TransactionService.processTransactionData(jsonData);
    }
  }

  private static processTransactionData(jsonData: Object): Array<Object> {
    const transactionData = [];
    if (jsonData['eveapi']['result']['rowset']['row']) {
      for (const row of jsonData['eveapi']['result']['rowset']['row']) {
        const date = row['@attributes']['transactionDateTime'];
        const ppi = row['@attributes']['price'];
        const quantity = row['@attributes']['quantity'];
        const typeName = row['@attributes']['typeName'];
        const typeID = row['@attributes']['typeID'];
        const clientName = row['@attributes']['clientName'];
        const clientID = row['@attributes']['clientID'];
        const transactionType = row['@attributes']['transactionType'];
        const transactionID = row['@attributes']['transactionID'];
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
    }
    return transactionData;
  }
}
