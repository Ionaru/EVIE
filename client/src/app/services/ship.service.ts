import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Logger } from 'angular2-logger/core';

import { Character } from '../models/character/character.model';
import { EndpointService } from '../models/endpoint/endpoint.service';

export interface IShipData {
  ship_item_id: number;
  ship_name: string;
  ship_type_id: number;
}

@Injectable()
export class ShipService {
  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  public async getCurrentShip(character: Character): Promise<{ id, name }> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'ship');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return {id: -1, name: 'Error'};
      }

      const shipData: IShipData = response.json();

      if (!(shipData.ship_type_id && shipData.ship_name)) {
        this.logger.error('Data did not contain expected values', shipData);
        return {id: -1, name: 'Error'};
      }

      return {
        id: shipData.ship_type_id,
        name: shipData.ship_name,
      };

    } catch (err) {
      this.logger.error(err);
      return {id: -1, name: 'Error'};
    }
  }
}
