import { Component, OnInit } from '@angular/core';
import { PricesChartComponent } from './prices-chart.component';
import { EVE } from '@ionaru/eve-utils';

@Component({
    selector: 'app-ore',
    styleUrls: ['./prices-chart.component.scss'],
    templateUrl: './prices-chart.component.html',
})
export class GasFullerenesComponent extends PricesChartComponent implements OnInit {
    public async ngOnInit() {
        this.set = [
            ...EVE.gasses.fullerenes,
        ];
        super.ngOnInit().then();
    }
}
