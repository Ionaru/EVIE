import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { ScopesComponent } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class WalletService extends BaseService {

    public async getWalletBalance(character: Character): Promise<number> {
        BaseService.confirmRequiredScope(character, ScopesComponent.scopeCodes.WALLET, 'getWalletBalance');

        const url = EVE.getCharacterWalletUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<number>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return -1;
        }
        return response;
    }
}
