import { ICharacterSkillQueueDataUnit } from '@ionaru/eve-utils';
import * as jwt from 'jwt-decode';

import { Calc } from '../../../shared/calc.helper';

export class Character {
    public characterId: number;
    public uuid: string;
    public name: string;
    public _accessToken?: string;
    public scopes: string[];
    public tokenExpiry: Date;
    public ownerHash: string;
    public gender?: string;
    public corporationId?: number;
    public birthday?: Date;
    public securityStatus?: number;
    public description?: string;
    public corporation?: string;
    public allianceId?: number;
    public alliance?: string;
    public race?: string;
    public bloodline?: string;
    public ancestory?: string;
    public balance = 0;
    public walletJournal: object[] = [];
    public walletTransactions: object[] = [];
    public currentTrainingSkill?: ISkillQueueDataWithName;
    public currentTrainingFinish?: Date;
    public currentTrainingCountdown?: number | countdown.Timespan;

    public totalTrainingFinish?: Date;
    public totalTrainingCountdown?: number | countdown.Timespan;

    public skillQueue: number[] = [];
    public assets: object[] = [];
    public planets: object[] = [];
    public mails: object[] = [];
    public location: {
        id?: number;
        name?: string | null;
    } = {};
    public currentShip: {
        id?: number;
        name?: string;
        type?: string | null;
    } = {};
    public refreshTimer?: number;

    public constructor(data: IApiCharacterData) {
        this.accessToken = data.accessToken;
        this.uuid = data.uuid;

        // Decode access token for information
        const tokenData = jwt<IJWTToken>(data.accessToken);
        this.tokenExpiry = new Date(Calc.secondsToMilliseconds(tokenData.exp));
        this.scopes = typeof tokenData.scp === 'string' ? [tokenData.scp] : tokenData.scp;
        this.ownerHash = tokenData.owner;
        this.name = tokenData.name;
        this.characterId = Number(tokenData.sub.split(':')[2]);
    }

    public set accessToken(token: string | undefined) {
        if (!token) {
            return;
        }

        const tokenData = jwt<IJWTToken>(token);
        this._accessToken = token;
        this.tokenExpiry = new Date(Calc.secondsToMilliseconds(tokenData.exp));
    }

    public get accessToken(): string | undefined {
        return this._accessToken;
    }

    public updateAuth(data: IApiCharacterData): void {
        this.characterId = data.characterId;
        this.name = data.name;
        this.accessToken = data.accessToken;
        this.ownerHash = data.ownerHash;
        this.uuid = data.uuid;
        this.scopes = data.scopes.split(' ');
        this.tokenExpiry = new Date(data.tokenExpiry);
    }

    public get hasValidAuth() {
        return this.accessToken && this.tokenExpiry >= new Date();
    }

    public hasScope(...scopes: string[]) {
        return this.hasValidAuth && scopes.every((scope) => this.scopes.includes(scope));
    }

    public getAuthorizationHeader() {
        return 'Bearer ' + this.accessToken;
    }

    public invalidateAuth() {
        this.accessToken = undefined;
        window.clearInterval(this.refreshTimer);
    }
}

export interface IApiCharacterData {
    accessToken: string;
    characterId: number;
    name: string;
    ownerHash: string;
    uuid: string;
    scopes: string;
    tokenExpiry: string;
    isActive: boolean;
}

export interface ITokenRefreshResponse {
    token: string;
}

export interface ISkillQueueDataWithName extends ICharacterSkillQueueDataUnit {
    name?: string;
}

interface IJWTToken {
    scp: string[] | string;
    jti: string;
    kid: string;
    sub: string;
    azp: string;
    name: string;
    owner: string;
    exp: number;
    iss: string;
}
