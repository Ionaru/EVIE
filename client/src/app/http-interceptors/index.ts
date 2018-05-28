/* "Barrel" of Http Interceptors */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { ESICachingInterceptor } from './esi-caching-interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
    {provide: HTTP_INTERCEPTORS, useClass: ESICachingInterceptor, multi: true},
];
