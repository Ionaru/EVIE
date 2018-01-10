import Timer = NodeJS.Timer;

export class Character {
  public characterId: number;
  public uuid: string;
  public name: string;
  public accessToken: string;
  public scopes: string[];
  public tokenExpiry: Date;
  public ownerHash: string;
  public gender: string;
  public corporationId: number;
  public corporation: string;
  public allianceId: number;
  public alliance: string;
  public race: string;
  public bloodline: string;
  public ancestory: string;
  public balance = 0;
  public walletJournal: object[] = [];
  public walletTransactions: object[] = [];
  public currentlyTraining = 0;
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
  public refreshTimer: Timer;

  public constructor(data: IApiCharacterData) {
    this.characterId = data.characterId;
    this.name = data.name;
    this.accessToken = data.accessToken;
    this.ownerHash = data.ownerHash;
    this.pid = data.pid;
    this.scopes = data.scopes.split(' ');
    this.tokenExpiry = new Date(data.tokenExpiry);
  }

  public updateAuth(data: IApiCharacterData): void {
    this.characterId = data.characterId;
    this.name = data.name;
    this.accessToken = data.accessToken;
    this.ownerHash = data.ownerHash;
    this.pid = data.pid;
    this.scopes = data.scopes.split(' ');
    this.tokenExpiry = new Date(data.tokenExpiry);
  }
}

export interface IEveCharacterData {
  alliance_id?: number;
  ancestry_id: number;
  birthday: string;
  bloodline_id: number;
  corporation_id: number;
  description: string;
  gender: string;
  name: string;
  race_id: number;
  security_status: number;
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

export interface ISSOSocketResponse {
  state: string;
  message: string;
  data: IApiCharacterData | undefined;
}

export interface ITokenRefreshResponse {
  state: string;
  message: string;
  data: {
    token: string;
  };
}
