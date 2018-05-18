import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';

import { AppReadyEventService } from '../app-ready-event.service';

@Injectable()
export class AppReadyGuard implements Resolve<boolean> {

    /**
     * Resolves if the app has started correctly.
     */
    public resolve(): Observable<any> {
        if (AppReadyEventService.appReady) {
            return of(true);
        } else {
            return AppReadyEventService.appReadyEvent;
        }
    }
}
