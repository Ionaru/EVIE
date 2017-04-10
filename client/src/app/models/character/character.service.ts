import { Injectable } from '@angular/core';
import { ApiCharacterData, Character, EveCharacterData, SSOSocketResponse, TokenRefreshResponse } from './character.model';
import { EndpointService } from '../endpoint/endpoint.service';
import { Globals } from '../../shared/globals';
import { Http, Response } from '@angular/http';

const tokenRefreshInterval = 15 * 60 * 1000;

@Injectable()
export class CharacterService {

  constructor(private endpointService: EndpointService, private globals: Globals, private http: Http) { }

  async getPublicCharacterData(character: Character): Promise<void> {
    const url = this.endpointService.constructESIUrl('v4/characters', character.characterId);
    const response: Response = await this.http.get(url).toPromise();
    const characterData: EveCharacterData = JSON.parse(response.text());
    character.gender = characterData.gender;
    character.corporation_id = characterData.corporation_id || 1;
    character.alliance_id = characterData.alliance_id;
  }

  async registerCharacter(data: ApiCharacterData): Promise<Character> {

    const character = new Character(data);
    this.globals.user.characters.push(character);
    if (data.isActive) {
      this.setActiveCharacter(character, true).then();
    }

    const tokenExpiryTime = character.tokenExpiry.getTime();
    const currentTime = Date.now();

    const timeLeft = (tokenExpiryTime - currentTime) - tokenRefreshInterval;
    if (timeLeft <= 0) {
      await this.refreshToken(character);
    }

    character.refreshTimer = setInterval(() => {
      this.refreshToken(character).then();
    }, tokenRefreshInterval);

    return character;
  }

  async refreshToken(character: Character): Promise<void> {
    const pid = character.pid;
    const accessToken = character.accessToken;
    const url = `/sso/refresh?pid=${pid}&accessToken=${accessToken}`;
    const response: Response = await this.http.get(url).toPromise();
    const json: TokenRefreshResponse = response.json();
    character.accessToken = json.data.token;
  }

  startAuthProcess(character?: Character): void {
    let url = '/sso/start';
    if (character) {
      url += '?characterPid=' + character.pid;
    }

    const w = window.open(url, '_blank', 'width=600,height=700');

    this.globals.socket.once('SSO_END', async (response: SSOSocketResponse) => {
      w.close();
      if (response.state === 'success') {
        if (character) {
          character.updateAuth(response.data);
          this.globals.characterChangeEvent.next(character);
        } else {
          const newCharacter = await this.registerCharacter(response.data);
          this.setActiveCharacter(newCharacter).then();
        }
      }
    });
  }

  async setActiveCharacter(character?: Character, alreadyActive?: boolean): Promise<void> {

    let characterPid;
    if (character) {
      characterPid = character.pid;
    }

    if (!alreadyActive) {
      this.http.post('/sso/activate', {characterPid: characterPid}).toPromise().then();
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
          this.setActiveCharacter().then();
        }
        const index = this.globals.user.characters.indexOf(character);
        this.globals.user.characters.splice(index, 1);
      }
    });
  }
}
