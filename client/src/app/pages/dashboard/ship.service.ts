import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import * as assert from 'assert';
import { Logger } from 'angular2-logger/core';

export interface ShipData {
  ship_item_id: number;
  ship_name: string;
  ship_type_id: number;
}

@Injectable()
export class ShipService {
  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  async getCurrentShip(character: Character): Promise<{ id, name }> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'ship');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {
      response = await this.http.get(url, {headers: headers}).toPromise().catch((errorResponse) => {
        response = errorResponse;
        throw new Error();
      });
      assert.equal(response.status, 200, `Request to ${url} returned ${response.status} instead of expected 200`);
      const shipData: ShipData = response.json();
      return {
        id: shipData.ship_type_id,
        name: shipData.ship_name,
      };
    } catch (err) {
      if (response) {
        this.logger.error(response);
      }
      this.logger.error(err);
      return {id: -1, name: 'Error'};
    }
  }
}
