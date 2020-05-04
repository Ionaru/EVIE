import { Component, OnInit } from '@angular/core';
import { OreComponent } from './ore.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-ore',
    styleUrls: ['./ore.component.scss'],
    templateUrl: './ore.component.html',
})
export class OreBeltComponent extends OreComponent implements OnInit {
    public async ngOnInit() {
        this.set = [
            ...EVE.ores.belt.highSec,
            ...EVE.ores.belt.lowSec,
            ...EVE.ores.belt.nullSec,
        ];
        super.ngOnInit().then();
    }
}
