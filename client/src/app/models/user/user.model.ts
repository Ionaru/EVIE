import { Character, IApiCharacterData } from '../character/character.model';

export class User {
    public uuid?: string;
    public username?: string;
    public email?: string;
    public isAdmin: boolean;
    public characters: Character[] = [];

    constructor(data?: IUserApiData) {
        // this.uuid = data.uuid;
        // this.username = data.username;
        // this.email = data.email;
        this.isAdmin = false;
    }
}

export interface ISSOLoginResponse {
    state: string;
    message: string;
    data: IUserApiData;
}

export interface ILoginResponse {
    state: string;
    message: string;
    data?: IUserApiData;
}

export interface IUserApiData {
    username: string;
    uuid: string;
    email: string;
    isAdmin: boolean;
    characters: IApiCharacterData[];
}

export interface IRegisterResponse {
    data: {
        email_in_use: boolean;
        username_in_use: boolean;
    };
    message: string;
    state: 'error' | 'success';
}
