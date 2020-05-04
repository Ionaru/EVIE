import { Component, OnInit } from '@angular/core';

import { RefiningProfitComponent } from './refining-profit.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-refining-profit',
    styleUrls: ['./refining-profit.component.scss'],
    templateUrl: './refining-profit.component.html',
})
export class RefiningProfitMoonComponent extends RefiningProfitComponent implements OnInit {
    public async ngOnInit() {
        this.set = [
            ...EVE.ores.moon.standard,
            ...EVE.ores.moon.ubiquitous,
            ...EVE.ores.moon.common,
            ...EVE.ores.moon.uncommon,
            ...EVE.ores.moon.rare,
            ...EVE.ores.moon.exceptional,
        ];
        super.ngOnInit().then();
    }
}
