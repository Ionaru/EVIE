import { Injectable } from '@angular/core';
// import { Globals } from '../../shared/globals';
// import { EndpointService } from '../endpoint/endpoint.service';
import { Character, IApiCharacterData, IEveCharacterData, ITokenRefreshResponse } from './character.model';
import { EndpointService } from '../endpoint/endpoint.service';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs/Subject';
import { Helpers } from '../../shared/helpers';

const tokenRefreshInterval = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class CharacterService {

    private static _characterChangeEvent = new Subject<Character>();
    public static get characterChangeEvent() { return this._characterChangeEvent; }

    private static _selectedCharacter: Character;
    public static get selectedCharacter() { return this._selectedCharacter; }

    constructor(private endpointService: EndpointService, private http: HttpClient) { }

    public async getPublicCharacterData(character: Character): Promise<void> {
        const url = this.endpointService.constructESIUrl(4, 'characters', character.characterId);
        const response = await this.http.get<any>(url).toPromise<IEveCharacterData>().catch((e) => e);
        character.birthday = Helpers.eveTimeToDate(response.birthday);
        character.gender = response.gender;
        character.corporationId = response.corporation_id || 1;
        character.allianceId = response.alliance_id;
        character.description = response.description;
        character.securityStatus = response.security_status;
    }

    public async registerCharacter(data: IApiCharacterData): Promise<Character> {

        const character = new Character(data);
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

        this.getPublicCharacterData(character).then();

        return character;
    }

    public async refreshToken(character: Character): Promise<void> {
        const pid = character.pid;
        const accessToken = character.accessToken;
        const url = `/sso/refresh?pid=${pid}&accessToken=${accessToken}`;
        const response = await this.http.get<any>(url).toPromise<ITokenRefreshResponse>().catch((e) => e);
        character.accessToken = response.data.token;
    }

    //
    // public startAuthProcess(character?: Character): void {
    //   let url = '/sso/start';
    //   if (character) {
    //     url += '?characterPid=' + character.pid;
    //   }
    //
    //   const w = window.open(url, '_blank', 'width=600,height=700');
    //
    //   this.globals.socket.once('SSO_END', async (response: ISSOSocketResponse) => {
    //     w.close();
    //     if (response.state === 'success') {
    //       if (character) {
    //         character.updateAuth(response.data);
    //         this.globals.characterChangeEvent.next(character);
    //       } else {
    //         const newCharacter = await this.registerCharacter(response.data);
    //         this.setActiveCharacter(newCharacter).then();
    //       }
    //     }
    //   });
    // }
    //
    public async setActiveCharacter(character?: Character, alreadyActive?: boolean): Promise<void> {

        let characterPid;
        if (character) {
            characterPid = character.pid;
        }

        if (!alreadyActive) {
            this.http.post('/sso/activate', {characterPid}).toPromise().then();
        }
        CharacterService._selectedCharacter = character;
        CharacterService.characterChangeEvent.next(character);
    }

    // public deleteCharacter(character: Character): void {
    //   const url = '/sso/delete';
    //   const data = {
    //     characterPid: character.pid,
    //   };
    //   this.http.post(url, data).subscribe((response: Response) => {
    //     const responseBody = response.json();
    //     if (responseBody.state === 'success') {
    //       clearInterval(character.refreshTimer);
    //
    //       if (this.globals.selectedCharacter && this.globals.selectedCharacter.pid === character.pid) {
    //         this.setActiveCharacter().then();
    //       }
    //       const index = this.globals.user.characters.indexOf(character);
    //       this.globals.user.characters.splice(index, 1);
    //     }
    //   });
    // }
}
