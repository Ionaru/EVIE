import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class BaseService {

    constructor(public http: HttpClient) { }

    public catchHandler = (parameter: HttpErrorResponse): HttpErrorResponse => parameter;
}
