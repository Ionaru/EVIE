import { Component, OnInit } from '@angular/core';

import { IWalletJournalData } from '../../../shared/interface.helper';
import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { WalletJournalService } from '../../data-services/wallet-journal.service';
import { WalletService } from '../../data-services/wallet.service';
import { CharacterService } from '../../models/character/character.service';
import { CountUp } from '../../shared/count-up';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

@Component({
    selector: 'app-wallet',
    styleUrls: ['./wallet.component.scss'],
    templateUrl: './wallet.component.html',
})
export class WalletComponent extends DataPageComponent implements OnInit {

    public journalData: IWalletJournalData[] = [];
    public balanceCountUp?: CountUp;

    public tableSettings: ITableHeader[] = [{
        attribute: 'date',
        hint: 'In EVE-Time',
        pipe: 'date',
        sort: true,
        title: 'Timestamp',
    }, {
        attribute: 'amount',
        classFunction: (data) => data.amount < 0 ? 'negative' : 'positive',
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
        this.requiredScopes = [ScopesComponent.scopeCodes.WALLET];
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
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.WALLET);
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
            this.journalData = await this.journalService.getWalletJournal(CharacterService.selectedCharacter);
        }
    }
}
