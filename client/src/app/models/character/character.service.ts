import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterData } from '@ionaru/eve-utils';
import { Subject } from 'rxjs';

import { Calc } from '../../../shared/calc.helper';
import { IServerResponse } from '../../data-services/base.service';
import { Character, IApiCharacterData, ITokenRefreshResponse } from './character.model';

const tokenRefreshInterval = 15 * Calc.minute;

@Injectable()
export class CharacterService {

    public static readonly characterChangeEvent = new Subject<Character>();

    private static _selectedCharacter?: Character;
    public static get selectedCharacter(): Character | undefined { return this._selectedCharacter; }

    constructor(private http: HttpClient) { }

    public async getPublicCharacterData(character: Character): Promise<void> {
        const url = EVE.getCharacterUrl(character.characterId);
        const response = await this.http.get<any>(url).toPromise<ICharacterData>();
        character.birthday = new Date(response.birthday);
        character.gender = response.gender;
        character.corporationId = response.corporation_id || 1;
        character.allianceId = response.alliance_id;
        character.description = response.description;
        character.securityStatus = response.security_status;
    }

    public async registerCharacter(data: IApiCharacterData): Promise<Character> {

        const character = new Character(data);
        this.getPublicCharacterData(character).then();
        if (data.isActive) {
            this.setActiveCharacter(character, true).then();
        }

        const tokenExpiryTime = character.tokenExpiry.getTime();
        const currentTime = Date.now();

        const tokenExpiry = tokenExpiryTime - currentTime;
        if (tokenExpiry < -(3 * Calc.week)) {
            // Refresh token is too old.
            character.invalidateAuth();
            return character;
        }

        const timeLeft = tokenExpiry - tokenRefreshInterval;
        if (timeLeft <= 0) {
            await this.refreshToken(character);
        }

        if (character.hasValidAuth) {
            character.refreshTimer = window.setInterval(() => {
                this.refreshToken(character).then();
            }, tokenRefreshInterval);
        }

        return character;
    }

    public async refreshToken(character: Character): Promise<void> {
        const uuid = character.uuid;
        const url = `/sso/refresh?uuid=${uuid}`;
        const response = await this.http.get<any>(url).toPromise<IServerResponse<ITokenRefreshResponse>>()
            .catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            character.invalidateAuth();
            return;
        }
        character.accessToken = response.data.token;
    }

    public async setActiveCharacter(character?: Character, skipServerCall = false): Promise<void> {

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

        const response = await this.http.post<any>(url, {characterUUID}).toPromise<IServerResponse>()
            .catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            throw response.error;
        }

        if (response.state === 'success') {
            character.invalidateAuth();

            if (CharacterService.selectedCharacter && CharacterService.selectedCharacter.uuid === character.uuid) {
                this.setActiveCharacter().then();
            }
        }
    }
}
