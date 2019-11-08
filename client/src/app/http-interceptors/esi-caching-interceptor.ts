import { HttpClient, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE } from '@ionaru/eve-utils';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ESIRequestCache } from '../shared/esi-request-cache';

@Injectable()
export class ESICachingInterceptor implements HttpInterceptor {

    constructor(private http: HttpClient) { }

    // tslint:disable-next-line:cognitive-complexity
    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        if (request.url.includes(EVE.ESIURL)) {
            request = request.clone({
                setHeaders: {'X-User-Agent': `EVIE ${environment.VERSION}, by #Ionaru`},
            });
        }

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
                            this.http.post('sso/log-route-warning', {route: request.url, text: warningText}).toPromise().then();
                        }
                    }

                    // Only cache when the response is successful and has an expiry header.
                    if (event.status === 200 && event.headers.has('expires')) {
                        ESIRequestCache.put(
                            request.urlWithParams,
                            event.body,
                            event.headers.get('expires') as string,
                            request.headers.has('Authorization'),
                            event.headers.get('x-pages') || undefined,
                        );
                    }
                }
            }),
        );
    }
}
