import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../../shared/eve.helper';
import { Character } from '../models/character/character.model';
import { BaseService } from './base.service';

@Injectable()
export class WalletService extends BaseService {

    public async getWalletBalance(character: Character): Promise<number> {
        const url = EVE.getCharacterWalletUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<number>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return -1;
        }
        return response;
    }
}
