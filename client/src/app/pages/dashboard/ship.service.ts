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
      const url2 = this.endpointService.constructESIUrl('v2/universe/names');
      return this.http.post(url2, [rep['ship_type_id']], {headers: headers}).map((response2) => {
        const repJSON = JSON.parse(response2['_body']);
        return {
          name: rep['ship_name'],
          ship: repJSON[0]['name'],
          timestamp: new Date().getTime()
        };
      });
    });
  }
}
