import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { User } from './user';
import { Observable } from 'rxjs';
import { isEmpty } from '../helperfunctions.component';
// import { Globals } from '../../globals';

@Injectable()
export class UserService {

  constructor(private http: Http) { }

  getUser(): Observable<any> {
    let url = 'api/login';
    return this.http.post(url, {
      username: 'testUser',
      password: '000999888',
    }).map(
      (res: Response) => {
        let jsonData = JSON.parse(res['_body']);
        if (!isEmpty(jsonData)) {
          console.log(jsonData);
          let user = new User();
          user.fillData(jsonData.data);
          return user;
        } else {
          return null;
        }
      }).retry(2).catch(() => {
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
