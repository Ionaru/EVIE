import { ErrorHandler, Injectable } from '@angular/core';
import * as Sentry from '@sentry/browser';

Sentry.init({
    dsn: 'https://4064eff091454347b283cc8b939a99a0@sentry.io/1318977',
    enabled: true,
    release: 'evie-client@0.7.2',
});

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
    public handleError(error: any) {
        Sentry.captureException(error.originalError || error);
        // tslint:disable-next-line:no-console
        console.error(error);
    }
}
