import { Injectable } from '@angular/core';
import { Character } from './character';
import { Observable, Subject } from 'rxjs';
import { EndpointService } from '../endpoint/endpoint.service';
import { Globals } from '../../globals';
import { Headers, Response, Http } from '@angular/http';
import { processXML } from '../helperfunctions.component';

const tokenRefreshInterval = 15 * 60 * 1000;

@Injectable()
export class CharacterService {

  characterChangeSource: Subject<Character> = new Subject<Character>();
  characterChange: Observable<Character> = this.characterChangeSource.asObservable();

  constructor(private es: EndpointService, private globals: Globals, private http: Http) { }

  public getCharacterData(character: Character): Observable<Character> {
    let url: string = this.es.constructXMLUrl(this.es.getEndpoint('CharacterSheet'), [
      'characterID=' + ''
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

  registerCharacter(data: CharacterApiData): Character {

    let character = new Character(data);
    this.setActiveCharacter(character);

    let tokenExpiryTime = character.tokenExpiry.getTime();
    if (tokenExpiryTime <= (Date.now() + tokenRefreshInterval)) {
      this.refreshToken(character).subscribe();
    }

    setInterval(() => {
      this.refreshToken(character).subscribe();
    }, tokenRefreshInterval);

    return character;
  }

  refreshToken(character: Character): Observable<void> {
    let pid = character.pid;
    let accessToken = character.accessToken;
    let url = `/sso/refresh?pid=${pid}&accessToken=${accessToken}`;
    return this.http.get(url).map((res) => {
      let response = JSON.parse(res['_body']);
      character.accessToken = response.data.token;
    });
  }

  reAuthenticate(character: Character): void {
    let w = window.open('/sso/start?characterPid=' + character.pid);

    this.globals.socket.on('SSO_END', (response: SSOSocketResponse): void => {
      w.close();
      if (response.state === 'success') {
        character.updateAuth(response.data);
      }
    });
  }

  setActiveCharacter(character: Character): void {
    this.globals.selectedCharacter = character;
    this.characterChangeSource.next(character);
  }

  activeCharacter(): Observable<Character> {
    return Observable.of(this.globals.selectedCharacter);
  }

  dumpCharacter(character: Character): void {
    console.log(character);
  }
}
