import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Helpers } from '../shared/helpers';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Globals } from '../shared/globals';
import { Endpoint } from '../models/endpoint/endpoint.model';
import { Logger } from 'angular2-logger/core';

export interface TransactionData {
  date: string;
  dateFormatted: string;
  price: number;
  quantity: number;
  transactionType: string;
  transactionID: string;
  ppi: number;
  typeName: string;
  typeID: string;
  clientName: string;
  clientID: string;
}

@Injectable()
export class TransactionService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private endpointService: EndpointService, private globals: Globals,
              private helpers: Helpers, private logger: Logger) {
    this.endpoint = this.endpointService.getEndpoint('WalletTransactions');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  async getTransactions(expired = false): Promise<Array<TransactionData>> {
    if (!expired && localStorage.getItem(this.storageTag)) {
      try {
        const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
        if (this.helpers.isCacheExpired(jsonData['eveapi']['cachedUntil'][0])) {
          return this.getTransactions(true);
        } else {
          return this.processTransactionData(jsonData);
        }
      } catch (error) {
        this.logger.error('Cache was invalid', error);
        localStorage.removeItem(this.storageTag);
        return this.getTransactions(true);
      }
    } else {
      localStorage.removeItem(this.storageTag);
      const url = this.endpointService.constructXMLUrl(this.endpoint, [
        'rowCount=50'
      ]);
      const headers = new Headers();
      headers.append('Accept', 'application/xml');
      const res = await this.http.get(url, {headers: headers}).toPromise();
      const jsonData = this.helpers.processXML(res);
      localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
      return this.processTransactionData(jsonData);
    }
  }

  private processTransactionData(jsonData: Object): Array<TransactionData> {
    const transactionData = [];
    if (jsonData['eveapi']['result'][0]['rowset'][0]['row']) {
      for (const row of jsonData['eveapi']['result'][0]['rowset'][0]['row']) {
        const date = row['$']['transactionDateTime'];
        const ppi = row['$']['price'];
        const quantity = row['$']['quantity'];
        const typeName = row['$']['typeName'];
        const typeID = row['$']['typeID'];
        const clientName = row['$']['clientName'];
        const clientID = row['$']['clientID'];
        const transactionType = row['$']['transactionType'];
        const transactionID = row['$']['transactionID'];
        transactionData.push({
          date: date,
          dateFormatted: this.helpers.eveTimeToDate(date).getTime(),
          price: ppi * quantity,
          quantity: quantity,
          transactionType: transactionType,
          transactionID: transactionID,
          ppi: ppi,
          typeName: typeName,
          typeID: typeID,
          clientName: clientName,
          clientID: clientID,
        });
      }
    }
    return this.helpers.sortArrayByObjectProperty(transactionData, 'dateFormatted', true);
  }
}
