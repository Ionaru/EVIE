import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ESIRequestCache } from '../shared/esi-request-cache';
import { Helpers } from '../shared/helpers';

@Injectable()
export class ESICachingInterceptor implements HttpInterceptor {
    constructor(private cache: ESIRequestCache) {}

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        // We only want to cache GET ESI calls.
        if (request.method !== 'GET' || !request.url.includes(Helpers.ESIURL)) {
            return next.handle(request);
        }

        const cachedResponse = this.cache.get(request);
        if (cachedResponse) {
            return of(cachedResponse);
        }

        return next.handle(request).pipe(
            tap((event) => {
                // There may be other events besides the response.
                if (event instanceof HttpResponse) {

                    if (event.status === 200 && event.headers.has('expires')) {
                        this.cache.put(request, event);
                    }
                }
            }),
        );
    }
}
