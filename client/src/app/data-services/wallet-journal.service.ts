import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { IWalletJournalData } from '../../shared/interface.helper';
import { Character } from '../models/character/character.model';

@Injectable()
export class WalletJournalService {

    constructor(private http: HttpClient) { }

    public async getWalletJournal(character: Character): Promise<IWalletJournalData[]> {
        const url = EVE.constructESIURL(4, 'characters', character.characterId, 'wallet', 'journal');
        const headers = new HttpHeaders({Authorization: 'Bearer ' + character.accessToken});
        const response = await this.http.get<any>(url, {headers}).toPromise<IWalletJournalData[]>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
