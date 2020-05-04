import { Component, OnInit } from '@angular/core';
import { OreComponent } from './ore.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-ore',
    styleUrls: ['./ore.component.scss'],
    templateUrl: './ore.component.html',
})
export class OreTrigComponent extends OreComponent implements OnInit {
    public async ngOnInit() {
        this.set = [
            ...EVE.ores.abyssal,
        ];
        super.ngOnInit().then();
    }
}
