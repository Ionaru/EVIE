import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Character } from '../models/character/character.model';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Logger } from 'angular2-logger/core';

export interface LocationData {
  solar_system_id: number;
  structure_id?: number;
}

@Injectable()
export class LocationService {
  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  async getLocation(character: Character): Promise<number> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'location');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers: headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return -1;
      }

      const locationData: LocationData = response.json();

      if (!locationData.solar_system_id) {
        this.logger.error('Data did not contain expected values', locationData);
        return -1;
      }

      return locationData.solar_system_id;

    } catch (err) {
      this.logger.error(err);
      return -1;
    }
  }
}
