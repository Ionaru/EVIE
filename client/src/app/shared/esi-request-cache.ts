import { HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ESIRequestCache {

    private cache: {[index: string]: HttpEvent<any>} = {};

    public get(request: HttpRequest<any>): HttpEvent<any> | undefined {
        return this.cache[request.urlWithParams];
    }

    public put(request: HttpRequest<any>, event: HttpResponse<any>): void {

        this.cache[request.urlWithParams] = event;

        const expiryHeader = event.headers.get('expires');
        if (expiryHeader) {
            const expiryDate = new Date(expiryHeader);
            const expiryTime = expiryDate.getTime() - Date.now();

            window.setTimeout(() => {
                this.delete(request);
            }, expiryTime);
        }
    }

    public delete(request: HttpRequest<any>): void {
        delete this.cache[request.urlWithParams];
    }
}
