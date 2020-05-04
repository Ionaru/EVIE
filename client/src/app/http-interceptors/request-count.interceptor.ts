import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

import { NavigationComponent } from '../navigation/navigation.component';

@Injectable()
export class RequestCountInterceptor implements HttpInterceptor {

    private counter = 0;

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        NavigationComponent.requestCounterUpdateEvent.next(++this.counter);

        return next.handle(request).pipe(
            tap((event) => {
                // There may be other events besides the response.
                if (event instanceof HttpResponse) {
                    NavigationComponent.requestCounterUpdateEvent.next(--this.counter);
                }
            }),
        );
    }
}
