import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, Observer } from 'rxjs';

import { UserService } from '../models/user/user.service';
import { AppReadyEventService } from '../app-ready-event.service';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private router: Router) { }

    public canActivate(): Observable<boolean> | boolean {
        if (AppReadyEventService.appReady) {
            if (UserService.user) {
                return true;
            } else {
                this.router.navigate(['/']).then();
                return false;
            }
        } else {
            return new Observable((observer: Observer<boolean>) => {
                AppReadyEventService.appReadyEvent.subscribe(() => {
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
