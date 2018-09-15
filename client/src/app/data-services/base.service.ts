import { HttpClient, HttpErrorResponse } from '@angular/common/http';

export class BaseService {

    constructor(public http: HttpClient) { }

    public catchHandler = (parameter: HttpErrorResponse): HttpErrorResponse => parameter;
}
