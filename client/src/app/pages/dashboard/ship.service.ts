import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { Observable } from 'rxjs';
import { Character } from '../../components/character/character';

@Injectable()
export class ShipService {
  constructor(private http: Http, private endpointService: EndpointService) {
  }

  getCurrentShip(character: Character, expired?: boolean): Observable<any> {
    // let storageTag = 'CurrentShip' + character.characterId;
    // if (!expired && localStorage.getItem(storageTag)) {
    //   let jsonData = JSON.parse(localStorage.getItem(storageTag));
    //   let now = new Date().getTime();
    //   if (now > (jsonData['timestamp'] + 5000)) {
    //     return this.getCurrentShip(character, true);
    //   } else {
    //     return Observable.of(Observable.of(jsonData));
    //   }
    // } else {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'ship');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    return this.http.get(url, {headers: headers}).map((response) => {
      const rep = JSON.parse(response['_body']);
      const url2 = this.endpointService.constructESIUrl('v2/universe/names');
      return this.http.post(url2, [rep['ship_type_id']], {headers: headers}).map((response2) => {
        const repJSON = JSON.parse(response2['_body']);
        const jsonData = {
          ship: rep['ship_name'],
          name: repJSON[0]['name'],
          timestamp: new Date().getTime()
        };
        // localStorage.setItem(storageTag, JSON.stringify(jsonData));
        return jsonData;
      });
    });
    // }
  }
}
