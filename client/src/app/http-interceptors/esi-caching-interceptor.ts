import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Helpers } from '../shared/helpers';

@Injectable()
export class ESIRequestCache {

    private cache: {[index: string]: HttpEvent<any>} = {};

    public get(request: HttpRequest<any>): HttpEvent<any> | undefined {
        return this.cache[request.urlWithParams];
    }

    public put(request: HttpRequest<any>, event: HttpResponse<any>): void {

        this.cache[request.urlWithParams] = event;

        const expiryDate = new Date(event.headers.get('expires'));
        const expiryTime = expiryDate.getTime() - Date.now();

        setTimeout(() => {
            this.delete(request);
        }, expiryTime);
    }

    public delete(request: HttpRequest<any>): void {
        delete this.cache[request.urlWithParams];
    }
}

@Injectable()
export class ESICachingInterceptor implements HttpInterceptor {
    constructor(private cache: ESIRequestCache) {}

    intercept(request: HttpRequest<any>, next: HttpHandler) {

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
