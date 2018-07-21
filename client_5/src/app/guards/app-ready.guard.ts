import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';

import { AppReadyEvent } from '../app-ready.event';

@Injectable()
export class AppReadyGuard implements Resolve<boolean> {

    /**
     * Resolves if the app has started correctly.
     */
    public resolve(): Observable<any> {
        if (AppReadyEvent.appReady) {
            return Observable.of(true);
        } else {
            return AppReadyEvent.appReadyEvent;
        }
    }
}
