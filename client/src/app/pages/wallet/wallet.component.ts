import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { IWalletJournalData, WalletJournalService } from '../../data-services/wallet-journal.service';
import { WalletService } from '../../data-services/wallet.service';
import { CharacterService } from '../../models/character/character.service';
import { CountUp } from '../../shared/count-up';

@Component({
    selector: 'app-wallet',
    styleUrls: ['./wallet.component.scss'],
    templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit, OnDestroy {

    public journalData: IWalletJournalData[] = [];
    public balanceCountUp!: CountUp;

    private balance!: number;
    private changeSubscription: Subscription;

    constructor(private walletService: WalletService, private journalService: WalletJournalService) {
        this.changeSubscription = CharacterService.characterChangeEvent.subscribe(() => {
            this.ngOnInit();
        });
    }

    public ngOnInit() {
        this.balanceCountUp = new CountUp('wallet-balance', 0, 0, 2);
        this.getBalanceData().then();
        this.getJournalData().then();
    }

    public ngOnDestroy() {
        this.changeSubscription.unsubscribe();
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
