import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, Observer } from 'rxjs';

import { AppReadyEventService } from '../app-ready-event.service';

@Injectable()
export class BaseGuard implements CanActivate {

    constructor(private router: Router) { }

    public condition(): boolean {
        return false;
    }

    // This guard will redirect to '/' when its condition is not met.
    public canActivate(): Observable<boolean> | boolean {
        if (AppReadyEventService.appReady) {
            if (this.condition()) {
                return true;
            } else {
                this.router.navigate(['/']).then();
                return false;
            }
        } else {
            return new Observable((observer: Observer<boolean>) => {
                AppReadyEventService.appReadyEvent.subscribe(() => {
                    if (this.condition()) {
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
