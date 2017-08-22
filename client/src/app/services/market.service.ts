import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Logger } from 'angular2-logger/core';
import { Character } from '../models/character/character.model';
import { Endpoint } from '../models/endpoint/endpoint.model';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Globals } from '../shared/globals';

export interface IOrderData {
  'account_id': number;
  'duration': number;
  'escrow': number;
  'is_buy_order': boolean;
  'is_corp': boolean;
  'issued': string;
  'location_id': number;
  'min_volume': number;
  'order_id': number;
  'price': number;
  'range': string;
  'region_id': number;
  'state': string;
  'type_id': number;
  'volume_remain': number;
  'volume_total': number;
}

@Injectable()
export class MarketService {

  private endpoint: Endpoint;
  private storageTag: string;

  constructor(private http: Http, private endpointService: EndpointService, private globals: Globals, private logger: Logger) {
    this.endpoint = this.endpointService.getEndpoint('WalletTransactions');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  public async getOrders(character: Character): Promise<IOrderData[]> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'orders');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers}).toPromise().catch((error) => {
        this.logger.error('Response error', error);
        return error;
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return [];
      }

      return response.json();

    } catch (err) {
      this.logger.error(err);
      return [];
    }

  }

}
