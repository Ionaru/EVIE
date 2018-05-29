import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { WalletService } from '../../data-services/wallet.service';
import { CharacterService } from '../../models/character/character.service';
import { CountUp } from '../../shared/count-up';

@Component({
    selector: 'app-wallet',
    styleUrls: ['./wallet.component.scss'],
    templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit, OnDestroy {

    public balanceCountUp!: CountUp;
    private changeSubscription: Subscription;

    constructor(private walletService: WalletService) {
        this.changeSubscription = CharacterService.characterChangeEvent.subscribe(() => {
            this.ngOnInit();
        });
    }

    public ngOnInit() {
        this.balanceCountUp = new CountUp('wallet-balance', 0, 0, 2);
        this.getBalanceData().then();
    }

    public ngOnDestroy() {
        this.changeSubscription.unsubscribe();
    }

    public async getBalanceData() {
        if (CharacterService.selectedCharacter) {
            const balance = await this.walletService.getWalletBalance(CharacterService.selectedCharacter);
            this.balanceCountUp.update(balance);
        }
    }
}
