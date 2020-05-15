import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { EsiCachingInterceptor } from './esi-caching.interceptor';
import { EsiLanguageInterceptor } from './esi-language.interceptor';
import { EsiRetryInterceptor } from './esi-retry.interceptor';
import { EsiUserAgentInterceptor } from './esi-user-agent.interceptor';
import { EsiWarningInterceptor } from './esi-warning.interceptor';
import { RequestCountInterceptor } from './request-count.interceptor';
import { ServerTokenInterceptor } from './server-token.interceptor';

export const httpInterceptorProviders = [
    {provide: HTTP_INTERCEPTORS, useClass: RequestCountInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: EsiCachingInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: EsiUserAgentInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: EsiWarningInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ServerTokenInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: EsiLanguageInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: EsiRetryInterceptor, multi: true},
];
