import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import * as assert from 'assert';

@Injectable()
export class LocationService {
  constructor(private http: Http, private endpointService: EndpointService) { }

  async getLocation(character: Character): Promise<number> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'location');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    try {
      const response: Response = await this.http.get(url, {headers: headers}).toPromise().catch(() => { throw new Error(); });
      assert.equal(response.status, 200, `Request to ${url} returned ${response.status} instead of expected 200`);
      const locationData: LocationData = response.json();
      return locationData.solar_system_id;
    } catch (err) {
      return -1;
    }
  }
}
