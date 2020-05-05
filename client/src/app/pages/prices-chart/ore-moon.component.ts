import { Component, OnInit } from '@angular/core';
import { PricesChartComponent } from './prices-chart.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-ore',
    styleUrls: ['./prices-chart.component.scss'],
    templateUrl: './prices-chart.component.html',
})
export class OreMoonComponent extends PricesChartComponent implements OnInit {
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
