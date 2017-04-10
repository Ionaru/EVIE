import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import * as crypto from 'crypto-js';

import { Globals } from '../../shared/globals';
import { Helpers } from '../../shared/helpers';
import { CharacterService } from '../character/character.service';
import { LoginResponse, User, UserApiData } from './user.model';

@Injectable()
export class UserService {

  constructor(private http: Http,
              private CharacterService: CharacterService,
              private globals: Globals,
              private helpers: Helpers) { }

  async shakeHands(): Promise<any> {
    const url = 'api/handshake';
    const response: Response = await this.http.get(url).toPromise().catch((error) => {
      return error;
    });
    if (response.ok) {
      const jsonData = response.json();
      if (jsonData.message === 'LoggedIn') {
        this.globals.loggedIn = true;
        this.storeUser(jsonData.data);
      }
    }
    return response;
  }

  async loginUser(username: string, password: string): Promise<[string, User]> {
    const url = 'api/login';
    const response: Response = await this.http.post(url, {
      username: username,
      password: UserService.hashPassword(password),
    }).toPromise().catch((error) => {
      return error;
    });
    const jsonData: LoginResponse = response.json();
    if (response.ok) {
      return [jsonData.message, this.storeUser(jsonData.data)];
    }
    return [jsonData.message, null];
  }

  logoutUser(): void {
    const url = 'api/logout';
    this.http.post(url, {}).toPromise().then(() => {
      window.location.reload();
    });
  }

  async registerUser(username: string, email: string, password: string): Promise<void> {
    const url = 'api/register';
    const userToRegister = {
      username: username,
      email: email,
      password: UserService.hashPassword(password)
    };
    await this.http.post(url, userToRegister).toPromise();
  }

  static hashPassword(passwordPlain: string): string {
    return crypto.enc.Base64.stringify(crypto.SHA256(passwordPlain));
  }

  storeUser(data: UserApiData): User {
    const user = new User(data);
    this.globals.userChangeEvent.next(user);
    this.globals.user = user;
    for (const characterData of data.characters) {
      if (characterData.scopes) {
        this.CharacterService.registerCharacter(characterData).then();
      }
    }
    if (!this.helpers.isEmpty(user.characters) && !this.globals.selectedCharacter) {
      this.CharacterService.setActiveCharacter(user.characters[0]).then();
    }
    return user;
  }
}
