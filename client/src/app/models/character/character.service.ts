import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Globals } from '../../shared/globals';
import { EndpointService } from '../endpoint/endpoint.service';
import { Character, IApiCharacterData, IEveCharacterData, ISSOSocketResponse, ITokenRefreshResponse } from './character.model';

const tokenRefreshInterval = 15 * 60 * 1000;

@Injectable()
export class CharacterService {

  constructor(private endpointService: EndpointService, private globals: Globals, private http: Http) { }

  public async getPublicCharacterData(character: Character): Promise<void> {
    const url = this.endpointService.constructESIUrl('v4/characters', character.characterId);
    const response: Response = await this.http.get(url).toPromise();
    const characterData: IEveCharacterData = JSON.parse(response.text());
    character.gender = characterData.gender;
    character.corporationId = characterData.corporation_id || 1;
    character.allianceId = characterData.alliance_id;
  }

  public async registerCharacter(data: IApiCharacterData): Promise<Character> {

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

  public async refreshToken(character: Character): Promise<void> {
    const pid = character.pid;
    const accessToken = character.accessToken;
    const url = `/sso/refresh?pid=${pid}&accessToken=${accessToken}`;
    const response: Response = await this.http.get(url).toPromise();
    const json: ITokenRefreshResponse = response.json();
    character.accessToken = json.data.token;
  }

  public startAuthProcess(character?: Character): void {
    let url = '/sso/start';
    if (character) {
      url += '?characterPid=' + character.pid;
    }

    const w = window.open(url, '_blank', 'width=600,height=700');

    this.globals.socket.once('SSO_END', async (response: ISSOSocketResponse) => {
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

  public async setActiveCharacter(character?: Character, alreadyActive?: boolean): Promise<void> {

    let characterPid;
    if (character) {
      characterPid = character.pid;
    }

    if (!alreadyActive) {
      this.http.post('/sso/activate', {characterPid}).toPromise().then();
    }
    this.globals.selectedCharacter = character;
    this.globals.characterChangeEvent.next(character);
  }

  public deleteCharacter(character: Character): void {
    const url = '/sso/delete';
    const data = {
      characterPid: character.pid,
    };
    this.http.post(url, data).subscribe((response: Response) => {
      const responseBody = response.json();
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
