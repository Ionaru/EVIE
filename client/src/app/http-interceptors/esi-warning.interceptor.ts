import { HttpClient, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

/**
 * Interceptor to communicate that an ESI route is giving a warning (usually deprecation).
 */
@Injectable()
export class EsiWarningInterceptor implements HttpInterceptor {

    constructor(private http: HttpClient) { }

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        return next.handle(request).pipe(
            tap((event) => {
                // There may be other events besides the response.
                if (event instanceof HttpResponse && event.status === 200 && event.headers.has('warning')) {

                    const warningText = event.headers.get('warning') as string;
                    if (warningText.includes('199') || warningText.includes('299')) {
                        this.http.post('sso/log-route-warning', {route: request.url, text: warningText}).toPromise().then();
                    }
                }
            }),
        );
    }
}
