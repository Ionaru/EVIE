import { Injectable } from '@angular/core';
import {
    Character, IApiCharacterData, IDeleteCharacterResponse, IEveCharacterData, ISSOSocketResponse,
    ITokenRefreshResponse
} from './character.model';
import { EndpointService } from '../endpoint/endpoint.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs/Subject';
import { Helpers } from '../../shared/helpers';
import { SocketService } from '../../socket/socket.service';

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

    public startAuthProcess(character?: Character): void {
        let url = '/sso/start';
        if (character) {
            url += '?characterPid=' + character.pid;
        }

        const w = window.open(url, '_blank', 'width=600,height=700');

        SocketService.socket.once('SSO_END', async (response: ISSOSocketResponse) => {
            w.close();
            if (response.state === 'success') {
                if (character) {
                    character.updateAuth(response.data);
                    CharacterService.characterChangeEvent.next(character);
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
        CharacterService._selectedCharacter = character;
        CharacterService.characterChangeEvent.next(character);
    }

    public async deleteCharacter(character: Character): Promise<void> {
        const url = '/sso/delete';
        const data = {
            characterPid: character.pid,
        };

        const response = await this.http.post<any>(url, data).toPromise<IDeleteCharacterResponse>()
            .catch((errorResponse: HttpErrorResponse) => {
                throw errorResponse.error;
            });
        if (response.state === 'success') {
            clearInterval(character.refreshTimer);

            if (CharacterService.selectedCharacter && CharacterService.selectedCharacter.pid === character.pid) {
                this.setActiveCharacter().then();
            }
        }
    }
}
