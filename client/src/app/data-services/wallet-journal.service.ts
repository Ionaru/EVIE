import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterWalletJournalData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { Scope } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class WalletJournalService extends BaseService {

    public async getWalletJournal(character: Character): Promise<ICharacterWalletJournalData> {
        BaseService.confirmRequiredScope(character, Scope.WALLET, 'getWalletJournal');

        const url = EVE.getCharacterWalletJournalUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterWalletJournalData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
