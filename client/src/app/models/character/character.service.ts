import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Helpers } from '../../shared/helpers';
import { Character, IApiCharacterData, IDeleteCharacterResponse, IEveCharacterData, ITokenRefreshResponse } from './character.model';

const tokenRefreshInterval = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class CharacterService {

    private static _characterChangeEvent = new Subject<Character>();
    public static get characterChangeEvent() { return this._characterChangeEvent; }

    private static _selectedCharacter: Character | undefined;
    public static get selectedCharacter(): Character | undefined { return this._selectedCharacter; }

    constructor(private http: HttpClient) { }

    public async getPublicCharacterData(character: Character): Promise<void> {
        const url = Helpers.constructESIUrl(4, 'characters', character.characterId);
        const response = await this.http.get<any>(url).toPromise<IEveCharacterData>().catch((e) => e);
        character.birthday = new Date(response.birthday);
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

        character.refreshTimer = window.setInterval(() => {
            this.refreshToken(character).then();
        }, tokenRefreshInterval);

        this.getPublicCharacterData(character).then();

        return character;
    }

    public async refreshToken(character: Character): Promise<void> {
        const uuid = character.uuid;
        const url = `/sso/refresh?uuid=${uuid}`;
        const response = await this.http.get<any>(url).toPromise<ITokenRefreshResponse>()
            .catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            window.setTimeout(() => {
                this.refreshToken(character).then();
            }, 5 * 1000);
            return;
        }
        character.accessToken = response.data.token;
    }

    public async setActiveCharacter(character?: Character, skipServerCall?: boolean): Promise<void> {

        if (!skipServerCall) {
            const url = '/sso/activate';
            const characterUUID = character ? character.uuid : undefined;
            this.http.post(url, {characterUUID}).toPromise().then();
        }

        CharacterService._selectedCharacter = character;
        CharacterService.characterChangeEvent.next(character);
    }

    public async deleteCharacter(character: Character): Promise<void> {

        const url = '/sso/delete';
        const characterUUID = character.uuid;

        const response = await this.http.post<any>(url, {characterUUID}).toPromise<IDeleteCharacterResponse>()
            .catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            throw response.error;
        }

        if (response.state === 'success') {
            if (character.refreshTimer) {
                window.clearInterval(character.refreshTimer);
            }

            if (CharacterService.selectedCharacter && CharacterService.selectedCharacter.uuid === character.uuid) {
                this.setActiveCharacter().then();
            }
        }
    }
}
