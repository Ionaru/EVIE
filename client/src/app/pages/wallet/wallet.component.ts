import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ICharacterWalletJournalData, ICharacterWalletJournalDataUnit } from '@ionaru/eve-utils';

import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { WalletJournalService } from '../../data-services/wallet-journal.service';
import { WalletService } from '../../data-services/wallet.service';
import { CharacterService } from '../../models/character/character.service';
import { CountUp } from '../../shared/count-up';
import { DataPageComponent } from '../data-page/data-page.component';
import { Scope } from '../scopes/scopes.component';
import { createTitle } from '../../shared/title';

@Component({
    selector: 'app-wallet',
    styleUrls: ['./wallet.component.scss'],
    templateUrl: './wallet.component.html',
})
export class WalletComponent extends DataPageComponent implements OnInit {

    public journalData: ICharacterWalletJournalData = [];
    public balanceCountUp?: CountUp;

    public taxAmount = 0;

    public tableSettings: ITableHeader<ICharacterWalletJournalDataUnit>[] = [{
        attribute: 'date',
        hint: 'In EVE-Time',
        pipe: 'date',
        sort: true,
        title: 'Timestamp',
        sortAttribute: 'id',
    }, {
        attribute: 'amount',
        classFunction: (data) => this.getAmountClass(data.amount),
        pipe: 'number',
        pipeVar: '0.2-2',
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

    constructor(
        private walletService: WalletService,
        private journalService: WalletJournalService,
        private title: Title,
    ) {
        super();
        this.requiredScopes = [Scope.WALLET];
    }

    public ngOnInit() {
        super.ngOnInit();
        this.title.setTitle(createTitle('Wallet'));
        this.balanceCountUp = undefined;
        if (WalletComponent.hasWalletScope) {
            this.getBalanceData().then();
            this.getJournalData().then();
        }
    }

    public getAmountClass(amount?: number) {
        if (amount && amount < 0) {
            return 'negative';
        }

        if (amount && amount > 0) {
            return 'positive';
        }

        return '';
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

            this.calculateTaxPaid(journalData);

            const journalDataWithTax: ICharacterWalletJournalData = [];

            for (const journalEntry of journalData) {
                if (journalEntry.tax) {
                    journalEntry.balance = (journalEntry.balance || 0) + journalEntry.tax;
                    journalEntry.amount = (journalEntry.amount || 0) + journalEntry.tax;
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

    public calculateTaxPaid(journalData: ICharacterWalletJournalData) {
        const reducer = (previous: number, current: ICharacterWalletJournalDataUnit) => previous + (current.tax || 0);
        this.taxAmount = journalData.reduce(reducer, 0);
    }
}
