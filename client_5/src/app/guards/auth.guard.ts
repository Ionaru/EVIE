import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';

import { Observer } from 'rxjs/Observer';
import { AppReadyEvent } from '../app-ready.event';
import { UserService } from '../models/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private router: Router) { }

    public canActivate(): Observable<boolean> | boolean {
        if (AppReadyEvent.appReady) {
            if (UserService.user) {
                return true;
            } else {
                this.router.navigate(['/']).then();
                return false;
            }
        } else {
            return Observable.create((observer: Observer<boolean>) => {
                AppReadyEvent.appReadyEvent.subscribe(() => {
                    if (UserService.user) {
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
