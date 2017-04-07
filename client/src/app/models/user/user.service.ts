import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';
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

  shakeHands(): Observable<any> {
    const url = 'api/handshake';
    return this.http.get(url).map(
      (res: Response) => {
        const jsonData: LoginResponse = JSON.parse(res['_body']);
        if (jsonData.message === 'LoggedIn') {
          this.globals.loggedIn = true;
          this.storeUser(jsonData.data);
        }
      }).catch((err): Observable<any> => {
      return Observable.of(new Error(err));
    });
  }

  loginUser(username: string, password: string): Observable<any> {
    const url = 'api/login';
    return this.http.post(url, {
      username: username,
      password: UserService.hashPassword(password),
    }).map(
      (res: Response) => {
        const jsonData: LoginResponse = JSON.parse(res['_body']);
        return [jsonData.message, this.storeUser(jsonData.data)];
      }).catch((err): Observable<any> => {
      if (err['_body']) {
        const errBody = JSON.parse(err['_body']);
        return Observable.of([errBody['message']]);
      }
    });
  }

  logoutUser(): void {
    const url = 'api/logout';
    this.http.post(url, {}).subscribe(() => {
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
