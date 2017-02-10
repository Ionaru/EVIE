import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Observable } from 'rxjs';
import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';

@Injectable()
export class ShipService {
  constructor(private http: Http, private endpointService: EndpointService) { }

  getCurrentShip(character: Character): Observable<any> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'ship');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    return this.http.get(url, {headers: headers}).map((response) => {
      const rep = JSON.parse(response['_body']);
      return {
        id: rep['ship_type_id'],
        name: rep['ship_name'],
      };
    });
  }
}
