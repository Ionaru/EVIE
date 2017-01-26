import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Globals } from './globals';
import { Observable, Observer } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private globals: Globals) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    console.log('canActivate');
    if (this.globals.startUp) {
      console.log('User');
      if (this.globals.user) {
        console.log('User - Yes');
        return true;
      } else {
        console.log('User - No');
        this.router.navigate(['/']);
        return false;
      }
    } else {
      return Observable.create((observer: Observer<boolean>) => {
        this.globals.startUpObservable.subscribe(() => {
          console.log('AuthGuard');
          if (this.globals.user) {
            console.log('AuthGuard - Yes');
            observer.next(true);
            observer.complete();
          } else {
            console.log('AuthGuard - No');
            this.router.navigate(['/']);
            observer.next(false);
            observer.complete();
          }
        });
      });
    }
  }
}
