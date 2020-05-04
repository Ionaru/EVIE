import { Component, OnInit } from '@angular/core';

import { RefiningProfitComponent } from './refining-profit.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-refining-profit',
    styleUrls: ['./refining-profit.component.scss'],
    templateUrl: './refining-profit.component.html',
})
export class RefiningProfitBeltComponent extends RefiningProfitComponent implements OnInit {
    public async ngOnInit() {
        this.set = [
            ...EVE.ores.belt.highSec,
            ...EVE.ores.belt.lowSec,
            ...EVE.ores.belt.nullSec,
        ];
        super.ngOnInit().then();
    }
}
