import { Injectable } from '@angular/core';
import { Character } from './character';
import { Observable } from 'rxjs';
import { EndpointService } from '../endpoint/endpoint.service';
import { Globals } from '../../globals';
import { Headers, Response, Http } from '@angular/http';
import { processXML } from '../helperfunctions.component';

@Injectable()
export class CharacterService {

  constructor(private es: EndpointService, private globals: Globals, private http: Http) { }

  public getCharacterData(character: Character): Observable<Character> {
    let url: string = this.es.constructUrl(this.es.getEndpoint('CharacterSheet'), [
      'characterID=' + this.globals.selectedCharacter.id
    ]);
    let headers: Headers = new Headers();
    headers.append('Accept', 'application/xml');
    return this.http.get(url, {
      headers: headers
    }).map((res: Response) => {
      let data: Object = processXML(res)['eveapi'];
      console.log(data);
      character.corporation = data['result']['corporationName']['#text'];
      character.corporation_id = data['result']['corporationID']['#text'];
      character.alliance = data['result']['allianceName']['#text'];
      character.alliance_id = data['result']['allianceID']['#text'];
      return character;
    });
  }

}
