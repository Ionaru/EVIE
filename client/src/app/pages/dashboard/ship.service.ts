import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Globals } from '../../globals';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { Observable } from 'rxjs';
import { Character } from '../../components/character/character';

@Injectable()
export class ShipService {
  constructor(private http: Http) {
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
    let url = `https://esi.tech.ccp.is/latest/characters/${character.characterId}/ship/`;
    url += '?datasource=tranquility';
    let headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    return this.http.get(url, {headers: headers}).map((response) => {
      let rep = JSON.parse(response['_body']);
      let url2 = 'https://esi.tech.ccp.is/latest/universe/names/';
      return this.http.post(url2, {'ids': [rep['ship_type_id']]}, {headers: headers}).map((response2) => {
        let repJSON = JSON.parse(response2['_body']);
        let jsonData = {
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
