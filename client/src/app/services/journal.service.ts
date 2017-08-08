import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Endpoint } from '../models/endpoint/endpoint.model';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Globals } from '../shared/globals';
import { Helpers } from '../shared/helpers';
import { IRefTypes } from './reftypes.service';

export interface IJournalData {
  dateRaw: string;
  dateFormatted: string;
  refTypeName: string;
  ownerName1: string;
  amountRaw: string;
  amountFormatted: string;
  balance: string;
}

export interface IJounralXMLData {
  eveapi: {
    cachedUntil: [string];
    result: [{
      rowset: [{
        row: [{
          $: {
            dateRaw: any;
            dateFormatted: any;
            refTypeName: any;
            ownerName1: any;
            amountRaw: any;
            amount: any;
            amountFormatted: any;
            balance: any;
            date: any;
            refTypeID: any;
          };
        }];
      }];
    }];
  };
}

@Injectable()
export class JournalService {

  private endpoint: Endpoint;
  private storageTag: string;
  private checkedForJournalBug = false;

  constructor(private http: Http,
              private endpointService: EndpointService,
              private globals: Globals,
              private helpers: Helpers) {
    this.endpoint = this.endpointService.getEndpoint('WalletJournal');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  public async getJournal(refTypes: IRefTypes, expired = false): Promise<IJournalData[]> {
    if (localStorage.getItem(this.storageTag) && !expired) {
      const jsonData = JSON.parse(localStorage.getItem(this.storageTag));
      if (this.helpers.isCacheExpired(jsonData.eveapi.cachedUntil[0])) {
        return await this.getJournal(refTypes, true);
      } else {
        return this.processJournalData(jsonData, refTypes);
      }
    } else {
      localStorage.removeItem(this.storageTag);
      const url = this.endpointService.constructXMLUrl(this.endpoint, [
        'rowCount=50',
      ]);
      const headers = new Headers();
      headers.append('Accept', 'application/xml');
      const response = await this.http.get(url, {headers}).toPromise();
      const jsonData = this.helpers.processXML(response) as IJounralXMLData;
      if (!this.checkedForJournalBug && localStorage.getItem(this.storageTag)) {
        // The journal XML API has a bug in which the journal data does not get updated even though the cache
        // is expired and new data should be available, this only happens on the first request to the API.
        // To work around this, we'll re-trigger the request one time if the cached data is exactly the same as the
        // new data.
        const oldData = JSON.parse(localStorage.getItem(this.storageTag)).eveapi.result[0].rowset;
        const newData = jsonData.eveapi.result[0].rowset;
        if (JSON.stringify(oldData) === JSON.stringify(newData)) {
          this.checkedForJournalBug = true;
          return await this.getJournal(refTypes, true);
        }
      }
      localStorage.setItem(this.storageTag, JSON.stringify(jsonData));
      this.checkedForJournalBug = false;
      return this.processJournalData(jsonData, refTypes);
    }
  }

  private processJournalData(jsonData: IJounralXMLData, refTypes: IRefTypes): IJournalData[] {
    const journalData = [];
    if (jsonData.eveapi.result[0].rowset[0].row) {
      for (const row of jsonData.eveapi.result[0].rowset[0].row) {
        const refTypeName = refTypes.eveapi.result[0].rowset[0].row[row.$.refTypeID];

        journalData.push({
          amountFormatted: Helpers.formatAmount(row.$.amount),
          amountRaw: Number(row.$.amount),
          balance: Helpers.formatAmount(row.$.balance),
          dateFormatted: this.helpers.eveTimeToDate(row.$.date),
          dateRaw: row.$.date,
          ownerName1: row.$.ownerName1,
          refTypeName,
        });
      }
    }
    return this.helpers.sortArrayByObjectProperty(journalData, 'dateRaw', true);
  }
}
