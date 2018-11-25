import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class BaseService {

    constructor(protected http: HttpClient) { }

    protected catchHandler = (parameter: HttpErrorResponse): HttpErrorResponse => parameter;
}
