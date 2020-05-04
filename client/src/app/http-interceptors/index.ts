/* "Barrel" of Http Interceptors */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { EsiCachingInterceptor } from './esi-caching.interceptor';
import { RequestCountInterceptor } from './request-count.interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
    {provide: HTTP_INTERCEPTORS, useClass: RequestCountInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: EsiCachingInterceptor, multi: true},
];
