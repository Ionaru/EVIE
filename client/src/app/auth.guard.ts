import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Globals } from './globals';
import { Observable, Observer } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private globals: Globals) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.globals.startUp) {
      if (this.globals.user) {
        return true;
      } else {
        this.router.navigate(['/']).then();
        return false;
      }
    } else {
      return Observable.create((observer: Observer<boolean>) => {
        this.globals.startUpObservable.subscribe(() => {
          if (this.globals.user) {
            observer.next(true);
            observer.complete();
          } else {
            this.router.navigate(['/']).then();
            observer.next(false);
            observer.complete();
          }
        });
      });
    }
  }
}
