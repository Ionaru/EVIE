import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Character } from '../models/character/character.model';
import { Helpers } from '../shared/helpers';

@Injectable()
export class BalanceService {

    constructor(private http: HttpClient) { }

    public async getBalance(character: Character): Promise<number> {
        const url = Helpers.constructESIUrl(1, 'characters', character.characterId, 'wallet');
        const headers = new HttpHeaders({Authorization: 'Bearer ' + character.accessToken});
        const response = await this.http.get<any>(url, {headers}).toPromise<number>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return -1;
        }
        return response;
    }
}
