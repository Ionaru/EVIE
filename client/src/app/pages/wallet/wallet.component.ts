import { Component, OnInit } from '@angular/core';
import { ICharacterWalletJournalData, ICharacterWalletJournalDataUnit } from '@ionaru/eve-utils';

import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { WalletJournalService } from '../../data-services/wallet-journal.service';
import { WalletService } from '../../data-services/wallet.service';
import { CharacterService } from '../../models/character/character.service';
import { CountUp } from '../../shared/count-up';
import { DataPageComponent } from '../data-page/data-page.component';
import { Scope } from '../scopes/scopes.component';

@Component({
    selector: 'app-wallet',
    styleUrls: ['./wallet.component.scss'],
    templateUrl: './wallet.component.html',
})
export class WalletComponent extends DataPageComponent implements OnInit {

    public journalData: ICharacterWalletJournalData = [];
    public balanceCountUp?: CountUp;

    public tableSettings: ITableHeader<ICharacterWalletJournalDataUnit>[] = [{
        attribute: 'date',
        hint: 'In EVE-Time',
        pipe: 'date',
        sort: true,
        title: 'Timestamp',
        sortAttribute: 'id',
    }, {
        attribute: 'amount',
        classFunction: (data) => (!data.amount || data.amount < 0) ? 'negative' : 'positive',
        pipe: 'number',
        pipeVar: '0.0-2',
        suffix: ' ISK',
    }, {
        attribute: 'balance',
        pipe: 'number',
        pipeVar: '0.2-2',
        suffix: ' ISK',
    }, {
        attribute: 'description',
    }];

    private balance!: number;

    constructor(private walletService: WalletService, private journalService: WalletJournalService) {
        super();
        this.requiredScopes = [Scope.WALLET];
    }

    public ngOnInit() {
        super.ngOnInit();
        this.balanceCountUp = undefined;
        if (WalletComponent.hasWalletScope) {
            this.getBalanceData().then();
            this.getJournalData().then();
        }
    }

    public static get hasWalletScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.WALLET);
    }

    public async getBalanceData() {
        if (CharacterService.selectedCharacter) {
            this.balance = await this.walletService.getWalletBalance(CharacterService.selectedCharacter);
            if (!this.balanceCountUp) {
                this.balanceCountUp = new CountUp('wallet-balance', 0, 0, 2);
            }
            this.balanceCountUp.update(this.balance);
        }
    }

    public async getJournalData() {
        if (CharacterService.selectedCharacter) {
            const journalData = await this.journalService.getWalletJournal(CharacterService.selectedCharacter);

            const journalDataWithTax: ICharacterWalletJournalData = [];

            for (const journalEntry of journalData) {
                if (journalEntry.tax) {
                    journalDataWithTax.push({
                        date: journalEntry.date,
                        // Make sure this always appears after the initial transaction.
                        id: journalEntry.id + 0.5,
                        description: 'Corporation tax',
                        ref_type: 'corporate_reward_tax',
                        amount: -journalEntry.tax,
                        balance: (journalEntry.balance || 0) - journalEntry.tax,
                    });
                }
                journalDataWithTax.push(journalEntry);
            }

            this.journalData = journalDataWithTax;
        }
    }
}
