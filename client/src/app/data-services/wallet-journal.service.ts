import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Character } from '../models/character/character.model';
import { EVE } from '../shared/eve';

export interface IWalletJournalData {
    // The amount of ISK given or taken from the wallet as a result of the given transaction. Positive when ISK is deposited into the wallet
    // and negative when ISK is withdrawn
    amount?: number;

    // Wallet balance after transaction occurred
    balance?: number;

    // An ID that gives extra context to the particular transaction. Because of legacy reasons the context is completely different per
    // ref_type and means different things. It is also possible to not have a context_id
    context_id?: number;

    // The type of the given context_id if present
    context_id_type?: string;

    // Date and time of transaction
    date: string;

    // The reason for the transaction, mirrors what is seen in the client
    description: string;

    // The id of the first party involved in the transaction. This attribute has no consistency and is different or non existent for
    // particular ref_types. The description attribute will help make sense of what this attribute means. For more info about the given ID
    // it can be dropped into the /universe/names/ ESI route to determine its type and name
    first_party_id?: number;

    // The id of the second party involved in the transaction. This attribute has no consistency and is different or non existent for
    // particular ref_types. The description attribute will help make sense of what this attribute means. For more info about the given ID
    // it can be dropped into the /universe/names/ ESI route to determine its type and name
    second_party_id?: number;

    // Unique journal reference ID
    id: number;

    // The user stated reason for the transaction. Only applies to some ref_types
    reason?: string;

    // The transaction type for the given transaction. Different transaction types will populate different attributes. Note: If you have an
    // existing XML API application that is using ref_types, you will need to know which string ESI ref_type maps to which integer. You can
    // look at the following file to see string->int mappings:
    // https://github.com/ccpgames/eve-glue/blob/master/eve_glue/wallet_journal_ref.py
    ref_type: string;

    // Tax amount received. Only applies to tax related transactions
    tax?: number;

    // The corporation ID receiving any tax paid. Only applies to tax related transactions
    tax_receiver_id?: number;
}

@Injectable()
export class WalletJournalService {

    constructor(private http: HttpClient) { }

    public async getWalletJournal(character: Character): Promise<IWalletJournalData[]> {
        const url = EVE.constructESIURL(4, 'characters', character.characterId, 'wallet', 'journal');
        const headers = new HttpHeaders({Authorization: 'Bearer ' + character.accessToken});
        const response = await this.http.get<any>(url, {headers}).toPromise<IWalletJournalData[]>()
            .catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return [];
        }
        return response;
    }
}
