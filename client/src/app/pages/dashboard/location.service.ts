import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import * as assert from 'assert';
import { Logger } from 'angular2-logger/core';

@Injectable()
export class LocationService {
  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  async getLocation(character: Character): Promise<number> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'location');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {
      response = await this.http.get(url, {headers: headers}).toPromise().catch((errorResponse) => {
        response = errorResponse;
        throw new Error();
      });
      assert.ok(response.ok, `Request to ${url} returned ${response.status} instead of expected 200`);
      const locationData: LocationData = response.json();
      return locationData.solar_system_id;
    } catch (err) {
      if (response) {
        this.logger.error(response);
      }
      this.logger.error(err);
      return -1;
    }
  }
}
