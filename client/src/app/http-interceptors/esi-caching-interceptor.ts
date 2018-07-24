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
                        console.log('LEGACY', warningText);
                        if (warningText.includes('299 - This is a legacy route')) {
                            console.log('LEGACY!!!!', warningText);
                            this.http.post('sso/log-deprecation', {route: request.url}).toPromise().catch((e) => {
                                console.log(e);
                            });
                        }
                    }

                    // Only cache when the response is successful and has an expiry header.
                    else if (event.status === 200 && event.headers.has('expires')) {
                        ESIRequestCache.put(request.urlWithParams, event.body, event.headers.get('expires') as string);
                    }
                }
            }),
        );
    }
}
