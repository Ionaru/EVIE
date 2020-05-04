import { Component, OnInit } from '@angular/core';
import { OreComponent } from './ore.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-ore',
    styleUrls: ['./ore.component.scss'],
    templateUrl: './ore.component.html',
})
export class OreMoonComponent extends OreComponent implements OnInit {
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
