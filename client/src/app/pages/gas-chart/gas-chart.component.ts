import { Component, NgZone, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { EVE } from '@ionaru/eve-utils';
import { ITableHeader } from '../../components/sor-table/sor-table.component';

interface IGassesData {
    // buy: number;
    id: number;
    // index: number;
    name: string;
    // sell: number;
    volume: number | string;
}

@Component({
    selector: 'app-gas-chart',
    styleUrls: ['./gas-chart.component.scss'],
    templateUrl: './gas-chart.component.html',
})
export class GasChartComponent implements OnInit {

    public visibleGroups = {
        'Booster Gas Clouds': true,
        'Fullerenes': true,
        'Other': true,
    };

    public visibleIcon = faEye;
    public hiddenIcon = faEyeSlash;

    public data: IGassesData[] = [];
    public visibleData: IGassesData[] = [];

    public tableSettings: Array<ITableHeader<any>> = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="https://imageserver.eveonline.com/Type/${data.id}_32.png" alt="${data.name}"> `,
        sort: true,
        sortAttribute: 'index',
        suffixFunction: (data) => `<span class="text-muted">${data.volume}m³</span>`,
        title: 'Type',
    }];

    constructor(private title: Title, private meta: Meta, private ngZone: NgZone) { }

    public ngOnInit() {
        this.title.setTitle('EVIE - EVE Online Gas Chart');
        this.meta.addTag({
            description: 'EVIE\'s Gas chart for EVE Online is a live-updated overview of the different gasses available in EVE Online ' +
                'and their current market prices.',
            keywords: [
                'EVE Online', 'EVIE',
                'Gas Table', 'Gas Chart', 'Overview', 'Prices',
                'Market', 'Mining', 'Miner', 'Boosters', 'ISK', 'Gas', 'Clouds', 'Gas Clouds', 'Fullerite', 'Harvesting', 'Harvester',
                'Highsec', 'Lowsec', 'Nullsec', 'Wormholes',
                'Mining Barge', 'Exhumer', 'Hulk', 'Mackinaw', 'Skiff', 'Covetor', 'Retriever', 'Procurer',
                'Mining Frigate', 'Venture', 'Prospect', 'Endurance',
                ...Object.keys(EVE.gas),
            ].join(', '),
        });
    }

    public changeVisibleGasses() {
        const visibleGasses: number[] = [];

        if (visibleGasses.length === this.data.length) {
            this.visibleData = this.data;
        }

        this.ngZone.run(() => {
            this.visibleData = [...this.data.filter((gas) => visibleGasses.includes(gas.id))];
        });
    }
}
