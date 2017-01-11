import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { User } from './user';
import { Observable } from 'rxjs';
import { CharacterService } from '../character/character.service';
// import { Globals } from '../../globals';

@Injectable()
export class UserService {

  constructor(private http: Http, private CharacterService: CharacterService) { }

  getUser(): Observable<any> {
    let url = 'api/login';
    return this.http.post(url, {
      username: 'testUser',
      password: '000999888',
    }).map(
      (res: Response) => {
        let jsonData: LoginResponse = JSON.parse(res['_body']);
        return this.registerUser(jsonData.data);
      }).retry(2);
  }

  registerUser(data: UserApiData): User {
    let user = new User(data);
    for (let characterData of data.characters) {
      user.characters.push(this.CharacterService.registerCharacter(characterData));
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
