import { Injectable, NgZone } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, Observer } from 'rxjs';

import { AppReadyEventService } from '../app-ready-event.service';

@Injectable()
export class BaseGuard implements CanActivate {

    public static readonly redirectKey = 'redirect';

    constructor(private router: Router, private ngZone: NgZone) { }

    public condition(): boolean {
        return false;
    }

    public navigateToHome() {
        this.ngZone.run(() => this.router.navigate(['/'])).then();
    }

    // This guard will redirect to '/' when its condition is not met.
    public canActivate(): Observable<boolean> | boolean {

        // Save path to redirect to after login.
        localStorage.setItem(BaseGuard.redirectKey, window.location.pathname);

        if (AppReadyEventService.appReady) {
            if (this.condition()) {
                localStorage.removeItem(BaseGuard.redirectKey);
                return true;
            } else {
                this.navigateToHome();
                return false;
            }
        } else {
            return new Observable((observer: Observer<boolean>) => {
                AppReadyEventService.appReadyEvent.subscribe(() => {
                    if (this.condition()) {
                        localStorage.removeItem(BaseGuard.redirectKey);
                        observer.next(true);
                    } else {
                        this.navigateToHome();
                        observer.next(false);
                    }
                    observer.complete();
                });
            });
        }
    }
}
