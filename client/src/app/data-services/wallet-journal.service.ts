import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EVE } from '../../shared/eve.helper';
import { IWalletJournalData } from '../../shared/interface.helper';
import { Character } from '../models/character/character.model';
import { BaseService } from './base.service';

@Injectable()
export class WalletJournalService extends BaseService {

    public async getWalletJournal(character: Character): Promise<IWalletJournalData[]> {
        const url = EVE.getCharacterWalletJournalUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<IWalletJournalData[]>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
