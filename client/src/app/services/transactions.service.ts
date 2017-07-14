import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Helpers } from '../shared/helpers';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Globals } from '../shared/globals';
import { Endpoint } from '../models/endpoint/endpoint.model';
import { Logger } from 'angular2-logger/core';
import { Character } from '../models/character/character.model';

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

export interface TransactionData2 {
  client_id: number;
  date: string;
  is_buy: boolean;
  is_personal: boolean;
  journal_ref_id: number;
  location_id: number;
  quantity: number;
  transaction_id: number;
  type_id: number;
  unit_price: number;
}

@Injectable()
export class TransactionsService {
  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  async getTransactions(character: Character, transactionId?: number): Promise<Array<TransactionData2>> {
    let url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'wallet/transactions');
    if (transactionId) {
      url += `?from_id=${transactionId}`;
    }

    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers: headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return null;
      }

      const transactionDataArray: Array<TransactionData2> = response.json();

      if (Helpers.isEmpty(transactionDataArray)) {
        this.logger.error('Data did not contain expected values', transactionDataArray);
        return null;
      }

      return transactionDataArray;

    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }
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
