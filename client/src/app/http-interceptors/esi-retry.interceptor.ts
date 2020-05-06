import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE } from '@ionaru/eve-utils';

import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen } from 'rxjs/operators';

export const genericRetryStrategy = () => (attempts: Observable<any>) => {

    const scalingDuration = 1500;
    const maxRetryAttempts = 2;

    return attempts.pipe(
        mergeMap((error, i) => {
            const retryAttempt = i + 1;

            if (retryAttempt > maxRetryAttempts || error.status < 500) {
                return throwError(error);
            }

            return timer(retryAttempt * scalingDuration);
        }),
    );
};

/**
 * Interceptor to retry an ESI request when it fails with a 5XX error.
 */
@Injectable()
export class EsiRetryInterceptor implements HttpInterceptor {

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        // We only want to retry ESI calls.
        if (!request.url.includes(EVE.ESIURL)) {
            return next.handle(request);
        }

        return next.handle(request).pipe(
            retryWhen(genericRetryStrategy()),
        );
    }
}
