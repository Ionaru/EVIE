import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BaseService } from '../data-services/base.service';

@Injectable()
export class ServerTokenInterceptor implements HttpInterceptor {

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        if (request.url.startsWith('data/')) {
            request = request.clone({
                setHeaders: {'x-evie-token': BaseService.serverToken},
            });
        }

        return next.handle(request);
    }
}
