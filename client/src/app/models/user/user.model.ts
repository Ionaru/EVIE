import { Character, IApiCharacterData } from '../character/character.model';

export class User {
    public uuid?: string;
    public isAdmin: boolean;
    public characters: Character[] = [];

    constructor(data: IUserApiData) {
        this.uuid = data.uuid;
        this.isAdmin = data.isAdmin;
    }
}

export interface ISSOAuthResponseData {
    user: IUserApiData;
    newCharacter: string;
}

export interface IUserApiData {
    username?: string;
    uuid: string;
    isAdmin: boolean;
    characters: IApiCharacterData[];
}
