import { Character, IApiCharacterData } from '../character/character.model';

export class User {
  public pid: string;
  public username: string;
  public email: string;
  public characters: Character[] = [];

  constructor(data: IUserApiData) {
    this.pid = data.pid;
    this.username = data.username;
    this.email = data.email;
  }
}

export interface ILoginResponse {
  state: string;
  message: string;
  data: IUserApiData;
}

export interface IUserApiData {
  username: string;
  pid: string;
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
