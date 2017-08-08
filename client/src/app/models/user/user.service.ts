import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import * as crypto from 'crypto-js';

import { Globals } from '../../shared/globals';
import { Helpers } from '../../shared/helpers';
import { CharacterService } from '../character/character.service';
import { LoginResponse, RegisterResponse, User, UserApiData } from './user.model';
import { Logger } from 'angular2-logger/core';

@Injectable()
export class UserService {

  constructor(private http: Http,
              private characterService: CharacterService,
              private globals: Globals, private logger: Logger,
              private helpers: Helpers) { }


  static hashPassword(passwordPlain: string): string {
    return crypto.enc.Base64.stringify(crypto.SHA256(passwordPlain));
  }

  async shakeHands(): Promise<any> {
    const url = 'api/handshake';
    const response: Response = await this.http.get(url).toPromise().catch((error) => {
      return error;
    });
    if (response.ok) {
      const jsonData = response.json();
      if (jsonData.message === 'LoggedIn') {
        this.globals.loggedIn = true;
        await this.storeUser(jsonData.data);
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
      const user = await this.storeUser(jsonData.data);
      this.globals.loggedIn = true;
      return [jsonData.message, user];
    }
    return [jsonData.message, null];
  }

  logoutUser(): void {
    const url = 'api/logout';
    this.http.post(url, {}).toPromise().then(() => {
      window.location.reload();
    });
  }

  async registerUser(username: string, email: string, password: string): Promise<string> {
    const url = 'api/register';
    const userToRegister = {
      username: username,
      email: email,
      password: UserService.hashPassword(password)
    };
    let response: Response;
    try {
      response = await this.http.post(url, userToRegister).toPromise().catch((errorResponse: Response) => {
        if (errorResponse.status === 409) {
          return errorResponse;
        }
        throw new Error(errorResponse.toString());
      });
      const result: RegisterResponse = response.json();
      if (result.data.username_in_use) {
        return 'username_in_use';
      } else if (result.data.email_in_use) {
        return 'email_in_use';
      } else if (result.state === 'error') {
        return 'error';
      } else {
        return 'success';
      }
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async storeUser(data: UserApiData): Promise<User> {
    const user = new User(data);
    this.globals.userChangeEvent.next(user);
    this.globals.user = user;

    // Register all the characters in parallel, but wait until they are all finished before continuing
    await Promise.all(data.characters.map(async (characterData) => {
      if (characterData.scopes) {
        await this.characterService.registerCharacter(characterData);
      }
    }));

    if (!Helpers.isEmpty(user.characters) && !this.globals.selectedCharacter) {
      this.characterService.setActiveCharacter(user.characters[0]).then();
    }
    return user;
  }
}
