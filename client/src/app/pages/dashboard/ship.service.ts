import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import * as assert from 'assert';

@Injectable()
export class ShipService {
  constructor(private http: Http, private endpointService: EndpointService) { }

  async getCurrentShip(character: Character): Promise<{id, name}> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'ship');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    try {
      const response: Response = await this.http.get(url, {headers: headers}).toPromise().catch(() => {throw new Error();});
      assert.equal(response.status, 200, `Request to ${url} returned ${response.status} instead of expected 200`);
      const shipData: ShipData = response.json();
      return {
        id: shipData.ship_type_id,
        name: shipData.ship_name,
      };
    } catch (err) {
      return {id: -1, name: 'Error'};
    }
  }
}
