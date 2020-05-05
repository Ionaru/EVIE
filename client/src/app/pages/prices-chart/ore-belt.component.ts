import { Component, OnInit } from '@angular/core';
import { PricesChartComponent } from './prices-chart.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-ore',
    styleUrls: ['./prices-chart.component.scss'],
    templateUrl: './prices-chart.component.html',
})
export class OreBeltComponent extends PricesChartComponent implements OnInit {
    public async ngOnInit() {
        this.set = [
            ...EVE.ores.belt.highSec,
            ...EVE.ores.belt.lowSec,
            ...EVE.ores.belt.nullSec,
        ];
        super.ngOnInit().then();
    }
}
