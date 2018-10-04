import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, Observer } from 'rxjs';

import { AppReadyEventService } from '../app-ready-event.service';
import { UserService } from '../models/user/user.service';

@Injectable()
export class AdminGuard implements CanActivate {

    private static checkCondition() {
        return UserService.user.isAdmin;
    }

    constructor(private router: Router) { }

    public canActivate(): Observable<boolean> | boolean {
        if (AppReadyEventService.appReady) {
            if (AdminGuard.checkCondition()) {
                return true;
            } else {
                this.router.navigate(['/']).then();
                return false;
            }
        } else {
            return new Observable((observer: Observer<boolean>) => {
                AppReadyEventService.appReadyEvent.subscribe(() => {
                    if (AdminGuard.checkCondition()) {
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
