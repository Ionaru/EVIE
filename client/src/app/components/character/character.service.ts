import { Injectable } from '@angular/core';
import { Character } from './character';
import { Observable } from 'rxjs';
import { EndpointService } from '../endpoint/endpoint.service';
import { Globals } from '../../globals';
import { Http, Headers, Response } from '@angular/http';

const tokenRefreshInterval = 15 * 60 * 1000;

@Injectable()
export class CharacterService {

  constructor(private endpointService: EndpointService, private globals: Globals, private http: Http) { }

  public getCharacterData(character: Character): Observable<any> {
    const url = this.endpointService.constructESIUrl('v4/characters', character.characterId);
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    return this.http.get(url, {headers: headers}).map((response: Response) => {
      const rep = JSON.parse(response.text());
      return true;
    });
  }

  registerCharacter(data: CharacterApiData): Character {

    const character = new Character(data);
    this.globals.user.characters.push(character);
    if (data.isActive) {
      this.setActiveCharacter(character, true);
    }
    const tokenExpiryTime = character.tokenExpiry.getTime();
    if (tokenExpiryTime <= (Date.now() + tokenRefreshInterval)) {
      this.refreshToken(character);
    }

    character.refreshTimer = setInterval(() => {
      this.refreshToken(character);
    }, tokenRefreshInterval);

    return character;
  }

  refreshToken(character: Character): void {
    const pid = character.pid;
    const accessToken = character.accessToken;
    const url = `/sso/refresh?pid=${pid}&accessToken=${accessToken}`;
    this.http.get(url).first().subscribe((res) => {
      const response = JSON.parse(res['_body']);
      character.accessToken = response.data.token;
    });
  }

  startAuthProcess(character?: Character): void {
    let url = '/sso/start';
    if (character) {
      url += '?characterPid=' + character.pid;
    }

    const w = window.open(url, '_blank', 'width=600,height=700');

    this.globals.socket.once('SSO_END', (response: SSOSocketResponse) => {
      w.close();
      if (response.state === 'success') {
        if (character) {
          character.updateAuth(response.data);
        } else {
          const newCharacter = this.registerCharacter(response.data);
          this.setActiveCharacter(newCharacter);
        }
      }
    });
  }

  setActiveCharacter(character?: Character, alreadyActive?: boolean): void {

    let characterPid;
    if (character) {
      characterPid = character.pid;
    }

    if (!alreadyActive) {
      this.http.post('/sso/activate', {characterPid: characterPid}).first().subscribe();
    }
    this.globals.selectedCharacter = character;
    this.globals.characterChangeEvent.next(character);
  }

  deleteCharacter(character: Character): void {
    const url = '/sso/delete';
    const data = {
      characterPid: character.pid
    };
    this.http.post(url, data).subscribe((response) => {
      const responseBody = JSON.parse(response['_body']);
      if (responseBody.state === 'success') {
        clearInterval(character.refreshTimer);

        if (this.globals.selectedCharacter && this.globals.selectedCharacter.pid === character.pid) {
          this.setActiveCharacter();
        }
        const index = this.globals.user.characters.indexOf(character);
        this.globals.user.characters.splice(index, 1);
      }
    });
  }
}
