import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { BalanceService } from '../../data-services/balance.service';
import { CharacterService } from '../../models/character/character.service';
import { CountUp } from '../../shared/count-up';

@Component({
    selector: 'app-wallet',
    templateUrl: './wallet.component.html',
    styleUrls: ['./wallet.component.scss'],
})
export class WalletComponent implements OnInit, OnDestroy {

    public balanceCountUp: CountUp;
    private changeSubscription: Subscription;

    constructor(private balanceService: BalanceService) {
        this.changeSubscription = CharacterService.characterChangeEvent.subscribe(() => {
            this.ngOnInit();
        });
    }

    ngOnInit() {
        this.balanceCountUp = new CountUp('wallet-balance', 0, 0, 2);
        this.getBalanceData().then();
    }

    ngOnDestroy() {
        this.changeSubscription.unsubscribe();
    }

    public async getBalanceData() {
        const balance = await this.balanceService.getBalance(CharacterService.selectedCharacter);
        this.balanceCountUp.update(balance);
    }
}
