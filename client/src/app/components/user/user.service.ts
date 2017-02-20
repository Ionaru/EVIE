import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { User } from './user';
import { Observable } from 'rxjs';
import { CharacterService } from '../character/character.service';
import { Globals } from '../../globals';
import { isEmpty } from '../helperfunctions.component';
import { AppReadyEvent } from '../../app-ready-event';

@Injectable()
export class UserService {

  constructor(private http: Http,
              private CharacterService: CharacterService,
              private globals: Globals,
              private appReadyEvent: AppReadyEvent) { }

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
      this.appReadyEvent.triggerFailed();
      return Observable.of(new Error(err));
    });
  }

  loginUser(username: string, password: string): Observable<any> {
    const url = 'api/login';
    return this.http.post(url, {
      username: username,
      password: password,
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

  registerUser(): void {

  }

  storeUser(data: UserApiData): User {
    const user = new User(data);
    this.globals.userChangeEvent.next(user);
    this.globals.user = user;
    for (const characterData of data.characters) {
      if (characterData.scopes) {
        this.CharacterService.registerCharacter(characterData);
      }
    }
    if (!isEmpty(user.characters) && !this.globals.selectedCharacter) {
      this.CharacterService.setActiveCharacter(user.characters[0]);
    }
    return user;
  }
}
