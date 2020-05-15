import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE } from '@ionaru/eve-utils';

/**
 * Interceptor to force the language to English for requests to the ESI.
 */
@Injectable()
export class EsiLanguageInterceptor implements HttpInterceptor {

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        if (request.url.includes(EVE.ESIURL)) {
            request = request.clone({
                setHeaders: {'Accept-Language': 'en-us'},
            });
        }

        return next.handle(request);
    }
}
