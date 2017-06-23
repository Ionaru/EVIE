import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Helpers } from '../shared/helpers';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Globals } from '../shared/globals';
import { Endpoint } from '../models/endpoint/endpoint.model';
import { Logger } from 'angular2-logger/core';
import { Character } from '../models/character/character.model';

export interface OrderData {
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

  constructor(private http: Http, private endpointService: EndpointService, private globals: Globals,
              private helpers: Helpers, private logger: Logger) {
    this.endpoint = this.endpointService.getEndpoint('WalletTransactions');
    this.storageTag = this.endpoint.name + this.globals.selectedCharacter.characterId;
  }

  async getOrders(character: Character): Promise<Array<OrderData>> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'orders');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers: headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return [];
      }

      const orders: Array<OrderData> = response.json();

      // if (!(shipData.ship_type_id && shipData.ship_name)) {
      //   this.logger.error('Data did not contain expected values', shipData);
      //   return {id: -1, name: 'Error'};
      // }
      //
      // return {
      //   id: shipData.ship_type_id,
      //   name: shipData.ship_name,
      // };
      return orders;

    } catch (err) {
      this.logger.error(err);
      return [];
    }

  }

}
