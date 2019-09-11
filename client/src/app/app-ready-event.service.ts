import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import * as Sentry from '@sentry/browser';
import { Observable, Observer } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable()
export class AppReadyEventService {

    private static _appReadyObserver: Observer<void>;
    private static _appReadyEvent: Observable<void> = new Observable((observer: Observer<void>) => {
        AppReadyEventService._appReadyObserver = observer;
    });
    public static get appReadyEvent() { return this._appReadyEvent; }

    private static _appReady = false;
    public static get appReady() { return this._appReady; }

    constructor(@Inject(DOCUMENT) private document: Document) { }

    public triggerSuccess(): void {
        // If the app-ready event has already been triggered, just ignore any calls to trigger it again.
        if (AppReadyEventService._appReady) {
            return;
        }

        AppReadyEventService._appReady = true;
        AppReadyEventService._appReadyObserver.next(undefined);
        AppReadyEventService._appReadyObserver.complete();
        this.document.dispatchEvent(new CustomEvent('StartupSuccess'));
    }

    public triggerFailure(info = 'Unexpected error', detail: Error): void {
        // If the app-ready event has already been triggered, just ignore any calls to trigger it again.
        if (AppReadyEventService._appReady) {
            return;
        }

        // Fire StartupFailed first so the 'error-info' and 'error-info-detail' elements are created.
        this.document.dispatchEvent(new CustomEvent('StartupFailed'));

        const errorInfoElement = this.document.getElementById('error-info');
        if (errorInfoElement) {
            errorInfoElement.innerText = info;
        }

        const errorInfoDetailElement = this.document.getElementById('error-info-detail');
        if (errorInfoDetailElement) {
            errorInfoDetailElement.innerText = detail.message;
        }

        AppReadyEventService._appReady = true;

        if (environment.production) {
            Sentry.captureException(detail);
        }

        throw detail;
    }
}
