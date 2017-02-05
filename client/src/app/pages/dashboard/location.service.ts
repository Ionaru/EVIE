import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Observable } from 'rxjs';
import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';

@Injectable()
export class LocationService {
  constructor(private http: Http, private endpointService: EndpointService) { }

  getLocation(character: Character): Observable<any> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'location');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    return this.http.get(url, {headers: headers}).map((response) => {
      const rep = JSON.parse(response['_body']);
      const url2 = this.endpointService.constructESIUrl('v2/universe/names');
      return this.http.post(url2, [rep['solar_system_id']], {headers: headers}).map((response2) => {
        const repJSON = JSON.parse(response2['_body']);
        return repJSON[0]['name'];
      });
    });
  }
}
