import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { User } from './user';
import { Observable } from 'rxjs';
import { CharacterService } from '../character/character.service';
import { Globals } from '../../globals';
import { isEmpty } from '../helperfunctions.component';
import { AppReadyEvent } from '../../app-ready-event';
// import { Globals } from '../../globals';

@Injectable()
export class UserService {

  constructor(private http: Http,
              private CharacterService: CharacterService,
              private globals: Globals,
              private appReadyEvent: AppReadyEvent) { }

  shakeHands(): Observable<any> {
    let url = 'api/handshake';
    return this.http.get(url).map(
      (res: Response) => {
        let jsonData: LoginResponse = JSON.parse(res['_body']);
        if (jsonData.message === 'LoggedIn') {
          this.globals.loggedIn = true;
          this.storeUser(jsonData.data);
        } else if (jsonData.message === 'NotLoggedIn') {
          // Something
        }
      }).catch((err): Observable<any> => {
      this.appReadyEvent.triggerFailed();
      return Observable.of(new Error('Could not shake hands with server'));
    });
  }

  loginUser(username: string, password: string): Observable<any> {
    let url = 'api/login';
    return this.http.post(url, {
      username: username,
      password: password,
    }).map(
      (res: Response) => {
        let jsonData: LoginResponse = JSON.parse(res['_body']);
        return [jsonData.message, this.storeUser(jsonData.data)];
      }).catch((err): Observable<any> => {
      if (err['_body']) {
        let errBody = JSON.parse(err['_body']);
        return Observable.of([errBody['message']]);
      }
    });
  }

  logoutUser(): void {
    let url = 'api/logout';
    this.http.post(url, {}).subscribe(() => {
      window.location.reload();
    });
  }

  registerUser(): void {

  }

  storeUser(data: UserApiData): User {
    let user = new User(data);
    this.globals.userChangeEvent.next(user);
    this.globals.user = user;
    for (let characterData of data.characters) {
      if (characterData.scopes) {
        this.CharacterService.registerCharacter(characterData);
      }
    }
    if (!isEmpty(user.characters) && !this.globals.selectedCharacter) {
      this.CharacterService.setActiveCharacter(user.characters[0]);
    }
    return user;
  }

  // private loggedIn = false;

  // constructor(private http: Http, private global: Globals) {
  //   // this.loggedIn = !!localStorage.getItem('auth_token');
  // }
  //
  // login(email, password) {
  //   let headers = new Headers();
  //   headers.append('Content-Type', 'application/json');
  //
  //   return this.http
  //     .post(
  //       '/login',
  //       JSON.stringify({ email, password }),
  //       { headers }
  //     )
  //     .map(res => res.json())
  //     .map((res) => {
  //       if (res.success) {
  //         localStorage.setItem('auth_token', res.auth_token);
  //         this.global.isLoggedIn = true;
  //       }
  //
  //       return res.success;
  //     });
  // }
  //
  // logout() {
  //   localStorage.removeItem('auth_token');
  //   this.global.isLoggedIn = false;
  // }
}
