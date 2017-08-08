import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, Observer } from 'rxjs';

import { Globals } from '../../shared/globals';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private globals: Globals) { }

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
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
