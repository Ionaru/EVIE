import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
// import { Logger } from 'angular2-logger/core';
import * as crypto from 'crypto-js';

import { Globals } from '../../shared/globals';
import { Helpers } from '../../shared/helpers';
import { CharacterService } from '../character/character.service';
import { ILoginResponse, IRegisterResponse, IUserApiData, User } from './user.model';

interface IHandshakeResponse {
  state: string;
  message: string;
  data?: IUserApiData;
}

@Injectable()
export class UserService {


  private static hashPassword(passwordPlain: string): string {
    return crypto.enc.Base64.stringify(crypto.SHA256(passwordPlain));
  }

  constructor(private http2: HttpClient, private http: Http, private characterService: CharacterService,
              private globals: Globals /*, private logger: Logger */) { }

  public async shakeHands(): Promise<any> {
    const url = 'api/handshake';
    const response: HttpResponse<IHandshakeResponse> = await this.http2.get(url, {observe: 'response'}).toPromise().catch((error) => error);
    if (response.ok) {
      const jsonData = response.body;
      if (jsonData.message === 'LoggedIn' && jsonData.data) {
        this.globals.loggedIn = true;
        await this.storeUser(jsonData.data);
      }
    }
    return response;
  }

  public async loginUser(username: string, password: string): Promise<[string, User]> {
    const url = 'api/login';
    const response: Response = await this.http.post(url, {
      password: UserService.hashPassword(password),
      username,
    }).toPromise().catch((error) => error);
    const jsonData: ILoginResponse = response.json();
    if (response.ok) {
      const user = await this.storeUser(jsonData.data);
      this.globals.loggedIn = true;
      return [jsonData.message, user];
    }
    return [jsonData.message, null];
  }

  public logoutUser(): void {
    const url = 'api/logout';
    this.http.post(url, {}).toPromise().then(() => {
      window.location.reload();
    });
  }

  public async registerUser(username: string, email: string, password: string): Promise<string> {
    const url = 'api/register';
    const userToRegister = {
      email,
      password: UserService.hashPassword(password),
      username,
    };
    let response: Response;
    try {
      response = await this.http.post(url, userToRegister).toPromise().catch((errorResponse: Response) => {
        if (errorResponse.status === 409) {
          return errorResponse;
        }
        throw new Error(errorResponse.toString());
      });
      const result: IRegisterResponse = response.json();
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
      // this.logger.error(error);
      return null;
    }
  }

  private async storeUser(data: IUserApiData): Promise<User> {
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
