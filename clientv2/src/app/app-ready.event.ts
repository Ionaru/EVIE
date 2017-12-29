import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable()
export class AppReadyEvent {

    private doc: Document;
    private isAppReady: boolean;

    constructor(@Inject(DOCUMENT) doc: Document) {
        this.doc = doc;
        this.isAppReady = false;
    }

    public triggerSuccess(): void {
        // If the app-ready event has already been triggered, just ignore any calls to trigger it again.
        if (this.isAppReady) {
            return;
        }

        this.doc.dispatchEvent(this.createEvent('StartupSuccess', true, false));
        this.isAppReady = true;
    }

    public triggerFailure(info = 'No info available', detail = ''): void {
        // If the app-ready event has already been triggered, just ignore any calls to trigger it again.
        if (this.isAppReady) {
            return;
        }

        this.doc.dispatchEvent(this.createEvent('StartupFailed', true, false));
        console.error(info, detail);
        this.doc.getElementById('error-info').innerText = info;
        this.doc.getElementById('error-info-detail').innerText = detail;
        this.isAppReady = true;
    }

    private createEvent(eventType: string, bubbles: boolean, cancelable: boolean): Event {
        // IE (shakes fist) uses some other kind of event initialization. As such,
        // we'll default to trying the "normal" event generation and then fallback to
        // using the IE version.
        let customEvent: CustomEvent;
        try {
            customEvent = new CustomEvent(
                eventType,
                {
                    bubbles,
                    cancelable,
                },
            );
        } catch (error) {
            customEvent = this.doc.createEvent('CustomEvent');
            customEvent.initCustomEvent(eventType, bubbles, cancelable, undefined);
        }
        return (customEvent);
    }
}
