import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Character } from '../models/character/character.model';

export interface IServerResponse<T = undefined> {
    state: string;
    message: string;
    data: T;
}

@Injectable()
export class BaseService {

    public static serverToken = '';

    protected static confirmRequiredScope(character: Character, scope: string, functionName: string) {
        if (!character.hasScope(scope)) {
            throw new Error(`Character ${ character.name } (${ character.uuid }) does not have\
            required scope "${ scope }" for ${ functionName }().`);
        }
    }

    constructor(protected http: HttpClient) { }

    protected catchHandler = (parameter: HttpErrorResponse): HttpErrorResponse => parameter;
}
