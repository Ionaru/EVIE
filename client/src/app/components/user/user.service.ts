import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { User } from './user';
import { Observable } from 'rxjs';
// import { Globals } from '../../globals';

@Injectable()
export class UserService {

  constructor(private http: Http) { }

  getUser(): Observable<User> {
    let url = 'api';
    return this.http.get(url).map(
      (res: Response) => {
        let user = new User();
        let jsonData = JSON.parse(res['_body']);
        console.log(jsonData);
        user.fillData(jsonData);
        return user;
      }).retry(2).catch(() => {
      console.log('AAAAH');
      return Observable.empty();
    });
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
