import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE } from '@ionaru/eve-utils';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ESIRequestCache } from '../shared/esi-request-cache';

@Injectable()
export class EsiCachingInterceptor implements HttpInterceptor {

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        // We only want to cache GET ESI calls.
        if (request.method !== 'GET' || !request.url.includes(EVE.ESIURL)) {
            return next.handle(request);
        }

        const cachedResponse = ESIRequestCache.get(request.urlWithParams);
        if (cachedResponse) {
            return of(cachedResponse);
        }

        return next.handle(request).pipe(
            tap((event) => {
                // Only cache when the response is successful and has an expiry header.
                if (event instanceof HttpResponse && event.status === 200 && event.headers.has('expires')) {

                    ESIRequestCache.put(
                        request.urlWithParams,
                        event.body,
                        event.headers.get('expires') as string,
                        request.headers.has('Authorization'),
                        event.headers.get('x-pages') || undefined,
                    );
                }
            }),
        );
    }
}
