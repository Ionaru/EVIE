import { HttpClient, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ESIRequestCache } from '../shared/esi-request-cache';
import { EVE } from '../shared/eve';

@Injectable()
export class ESICachingInterceptor implements HttpInterceptor {

    constructor(private http: HttpClient) { }

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
                // There may be other events besides the response.
                if (event instanceof HttpResponse) {

                    if (event.status === 200 && event.headers.has('warning')) {
                        const warningText = event.headers.get('warning') as string;
                        if (warningText.includes('199') || warningText.includes('299')) {
                            this.http.post('sso/log-route-warning', {route: request.url, text: warningText}).subscribe();
                        }
                    }

                    // Only cache when the response is successful and has an expiry header.
                    if (event.status === 200 && event.headers.has('expires')) {
                        ESIRequestCache.put(request.urlWithParams, event.body, event.headers.get('expires') as string);
                    }
                }
            }),
        );
    }
}
