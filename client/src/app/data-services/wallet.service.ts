import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { Character } from '../models/character/character.model';

@Injectable()
export class WalletService {

    constructor(private http: HttpClient) { }

    public async getWalletBalance(character: Character): Promise<number> {
        const url = EVE.constructESIURL(1, 'characters', character.characterId, 'wallet');
        const headers = new HttpHeaders({Authorization: 'Bearer ' + character.accessToken});
        const response = await this.http.get<any>(url, {headers}).toPromise<number>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return -1;
        }
        return response;
    }
}
