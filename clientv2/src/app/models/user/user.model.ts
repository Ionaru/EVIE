import { Character, IApiCharacterData } from '../character/character.model';

export class User {
  public uuid: string;
  public username: string;
  public email: string;
  public characters: Character[] = [];

  constructor(data: IUserApiData) {
    this.uuid = data.uuid;
    this.username = data.username;
    this.email = data.email;
  }
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
