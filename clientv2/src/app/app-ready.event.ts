import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class AppReadyEvent {

    private static _appReadyEvent = new BehaviorSubject<void>(null);
    public static get appReadyEvent() { return this._appReadyEvent; }

    private static _appReady = false;
    public static get appReady() { return this._appReady; }

    constructor(@Inject(DOCUMENT) private doc: Document) { }

    public triggerSuccess(): void {
        // If the app-ready event has already been triggered, just ignore any calls to trigger it again.
        if (AppReadyEvent._appReady) {
            return;
        }

        AppReadyEvent._appReady = true;
        AppReadyEvent.appReadyEvent.complete();
        document.dispatchEvent(this.createEvent('StartupSuccess'));
    }

    public triggerFailure(info = 'No info available', detail = ''): void {
        // If the app-ready event has already been triggered, just ignore any calls to trigger it again.
        if (AppReadyEvent._appReady) {
            return;
        }

        // Fire StartupFailed first so the 'error-info' and 'error-info-detail' elements are created.
        this.doc.dispatchEvent(this.createEvent('StartupFailed'));

        this.doc.getElementById('error-info').innerText = info;
        this.doc.getElementById('error-info-detail').innerText = detail;
        AppReadyEvent._appReady = true;
    }

    private createEvent(eventType: string): Event {
        // IE (shakes fist) uses some other kind of event initialization. As such,
        // we'll default to trying the "normal" event generation and then fallback to
        // using the IE version.
        let customEvent: CustomEvent;
        try {
            customEvent = new CustomEvent(eventType);
        } catch (error) {
            customEvent = this.doc.createEvent('CustomEvent');
            customEvent.initCustomEvent(eventType, false, false, undefined);
        }
        return (customEvent);
    }
}
