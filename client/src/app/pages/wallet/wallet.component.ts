import { Component, OnInit } from '@angular/core';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons';

import { IWalletJournalData } from '../../../shared/interface.helper';
import { WalletJournalService } from '../../data-services/wallet-journal.service';
import { WalletService } from '../../data-services/wallet.service';
import { CharacterService } from '../../models/character/character.service';
import { CountUp } from '../../shared/count-up';
import { DataPageComponent } from '../data-page/data-page.component';

@Component({
    selector: 'app-wallet',
    styleUrls: ['./wallet.component.scss'],
    templateUrl: './wallet.component.html',
})
export class WalletComponent extends DataPageComponent implements OnInit {

    public faInfoCircle = faInfoCircle;

    public journalData: IWalletJournalData[] = [];
    public balanceCountUp!: CountUp;

    private balance!: number;

    constructor(private walletService: WalletService, private journalService: WalletJournalService) {
        super();
    }

    public ngOnInit() {
        super.ngOnInit();
        this.balanceCountUp = new CountUp('wallet-balance', 0, 0, 2);
        this.getBalanceData().then();
        this.getJournalData().then();
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
