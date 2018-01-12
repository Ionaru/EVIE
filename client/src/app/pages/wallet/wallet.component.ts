import { Component, OnInit } from '@angular/core';

import { BalanceService } from '../../data-services/balance.service';
import { CharacterService } from '../../models/character/character.service';
import { CountUp } from '../../shared/count-up';

@Component({
    selector: 'app-wallet',
    templateUrl: './wallet.component.html',
    styleUrls: ['./wallet.component.scss'],
})
export class WalletComponent implements OnInit {

    public selectedCharacter = CharacterService.selectedCharacter;
    public balanceCountUp: CountUp;

    constructor(private balanceService: BalanceService) { }

    ngOnInit() {
        this.balanceCountUp = new CountUp('wallet-balance', 0, 0, 2);
        this.getBalanceData().then();
    }

    public async getBalanceData() {
        const balance = await this.balanceService.getBalance(this.selectedCharacter);
        this.balanceCountUp.update(balance);
    }
}
