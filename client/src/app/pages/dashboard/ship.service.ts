import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Globals } from '../../globals';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { Observable } from 'rxjs';

@Injectable()
export class ShipService {
  constructor(private http: Http, private es: EndpointService, private globals: Globals) {
  }

  getCurrentShip(): Observable<any> {
    let url = `https://esi.tech.ccp.is/latest/characters/${this.globals.selectedCharacter.characterId}/ship/`;
    url += '?datasource=tranquility';
    let headers = new Headers();
    headers.append('Authorization', 'Bearer ' + this.globals.selectedCharacter.accessToken);
    return this.http.get(url, {headers: headers}).map((response) => {
      let rep = JSON.parse(response['_body']);
      let url2 = 'https://esi.tech.ccp.is/latest/universe/names/';
      return this.http.post(url2, {'ids': [rep['ship_type_id']]}, {headers: headers}).map((response2) => {
        let repJSON = JSON.parse(response2['_body']);
        return {
          ship: rep['ship_name'],
          name: repJSON[0]['name']
        };
      });
    });
  }
}
