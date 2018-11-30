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
    public balanceCountUp!: CountUp;

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

    protected requiredScopes = [ScopesComponent.scopeCodes.WALLET, ScopesComponent.scopeCodes.ORDERS];

    private balance!: number;

    constructor(private walletService: WalletService, private journalService: WalletJournalService) {
        super();
    }

    public ngOnInit() {
        super.ngOnInit();
        if (CharacterService.selectedCharacter) {
            this.balanceCountUp = new CountUp('wallet-balance', 0, 0, 2);
            this.getBalanceData().then();
            this.getJournalData().then();
        }
    }

    public async getBalanceData() {
        if (CharacterService.selectedCharacter) {
            this.balance = await this.walletService.getWalletBalance(CharacterService.selectedCharacter);
            this.balanceCountUp.update(this.balance);
        }
    }

    public async getJournalData() {
        if (CharacterService.selectedCharacter) {
            this.journalData = await this.journalService.getWalletJournal(CharacterService.selectedCharacter);
        }
    }
}
