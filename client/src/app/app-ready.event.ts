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

  public trigger(): void {
    // If the app-ready event has already been triggered, just ignore any subsequent
    // calls to trigger it again.
    if (this.isAppReady) {
      return;
    }
    const bubbles = true;
    const cancelable = false;
    this.doc.dispatchEvent(this.createEvent('StartupSuccess', bubbles, cancelable));
    this.isAppReady = true;
  }

  public triggerFailed(info?: string, detail?: string): void {
    if (this.isAppReady) {
      return;
    }
    const bubbles = true;
    const cancelable = false;
    this.doc.dispatchEvent(this.createEvent('StartupFailed', bubbles, cancelable));
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
    return ( customEvent );
  }
}
