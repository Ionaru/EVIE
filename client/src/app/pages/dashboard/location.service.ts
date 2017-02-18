import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Observable } from 'rxjs';
import { Character } from '../../components/character/character';
import { EndpointService } from '../../components/endpoint/endpoint.service';

@Injectable()
export class LocationService {
  constructor(private http: Http, private endpointService: EndpointService) { }

  getLocation(character: Character): Observable<number> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'location');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    return this.http.get(url, {headers: headers}).map((response: Response) => {
      if (response.status === 200) {
        const rep = response.json();
        return rep['solar_system_id'];
      } else {
        throw new Error();
      }

    }).retry(1).catch((error) => {
      const response = -1;
      return Observable.of( response );
    });
  }
}
