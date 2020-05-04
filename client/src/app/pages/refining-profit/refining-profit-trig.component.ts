import { Component, OnInit } from '@angular/core';

import { RefiningProfitComponent } from './refining-profit.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-refining-profit',
    styleUrls: ['./refining-profit.component.scss'],
    templateUrl: './refining-profit.component.html',
})
export class RefiningProfitTrigComponent extends RefiningProfitComponent implements OnInit {
    public async ngOnInit() {
        this.set = [
            ...EVE.ores.abyssal,
        ];
        super.ngOnInit().then();
    }
}
