/* tslint:disable:no-duplicate-string */
import { Component, NgZone, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { objectsArrayToObject, sortArrayByObjectProperty } from '@ionaru/array-utils';
import { EVE, Gas, IMarketOrdersData, IUniverseTypeData } from '@ionaru/eve-utils';

import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { MarketService } from '../../data-services/market.service';
import { TypesService } from '../../data-services/types.service';
import { createTitle } from '../../shared/title';

interface IGassesData {
    buy: number;
    id: number;
    name: string;
    sell: number;
    spread: number;
    venture: number;
    volume?: number | string;
}

interface IGasPrices {
    buy: IGasPrice;
    sell: IGasPrice;
}

interface IGasPrice {
    [index: number]: number;
}

interface IGasTypesDict {
    [index: number]: IUniverseTypeData;
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
        'Other': false,
    };

    public visibleIcon = faEye;
    public hiddenIcon = faEyeSlash;

    public visibleData?: IGassesData[];

    public tableSettings: ITableHeader<IGassesData>[] = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="https://images.evetech.net/types/${data.id}/icon?size=32" alt="${data.name}"> `,
        sort: true,
        suffixFunction: (data) => `<span class="text-muted">${data.volume}m³</span>`,
        title: 'Type',
    }, {
        attribute: 'buy',
        hint: 'Average for using buy orders to sell 5.000m³ of gas.',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Buy price / m³',
    }, {
        attribute: 'sell',
        hint: 'Average for using sell orders to buy 5.000m³ of gas.',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Sell price / m³',
    }, {
        attribute: 'spread',
        hint: 'Difference between buy and sell prices.',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Spread',
    }, {
        attribute: 'venture',
        hint: '5.000m³',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Sell price / Venture',
    }];

    private data: IGassesData[] = [];
    private gasTypes: IGasTypesDict = {};
    private gasPrices: IGasPrices = {
        buy: {},
        sell: {},
    };

    constructor(
        private title: Title,
        private ngZone: NgZone,
        private typesService: TypesService,
        private marketService: MarketService,
    ) { }

    public async ngOnInit() {
        this.title.setTitle(createTitle('EVE Online Gas Chart'));

        await this.fetchGasTypeInformation();

        await Promise.all([...EVE.gasses.fullerenes, ...EVE.gasses.boosterGasClouds].map(async (gas) => {
            const orders = await this.marketService.getMarketOrders(10000002, gas);
            if (orders) {
                const jitaOrders = orders.filter((order) => order.location_id === 60003760);
                this.getPriceForVolume(gas, jitaOrders, 5000).then();
                this.getPriceForVolume(gas, jitaOrders, 5000, false).then();
            }
        }));

        this.data = [...EVE.gasses.fullerenes, ...EVE.gasses.boosterGasClouds].map((gas) => {
            return {
                buy: this.gasPrices.buy[gas],
                id: gas,
                name: this.getGasName(gas),
                sell: this.gasPrices.sell[gas],
                spread: this.gasPrices.sell[gas] - this.gasPrices.buy[gas],
                venture: this.gasPrices.sell[gas] * 5000,
                volume: this.gasTypes[gas].volume,
            };
        });

        sortArrayByObjectProperty(this.data, 'name');

        this.changeVisibleGasses();
    }

    public changeVisibleGasses() {
        const visibleGasses: number[] = [];

        if (this.visibleGroups.Fullerenes) {
            visibleGasses.push(...EVE.gasses.fullerenes);
        }

        if (this.visibleGroups['Booster Gas Clouds']) {
            visibleGasses.push(...EVE.gasses.boosterGasClouds);
        }

        if (visibleGasses.length === this.data.length) {
            this.visibleData = this.data;
        }

        this.ngZone.run(() => {
            this.visibleData = [...this.data.filter((gas) => visibleGasses.includes(gas.id))];
        });
    }

    private async getPriceForVolume(gas: number, orders: IMarketOrdersData, volume: number, buy = true) {
        const buyOrders = orders.filter((order) => order.is_buy_order === buy);
        sortArrayByObjectProperty(buyOrders, 'price', buy);
        const buySell = buy ? 'buy' : 'sell';

        const type = this.gasTypes[gas];

        if (!type || !type.volume) {
            this.gasPrices[buySell][gas] = -1;
            return;
        }

        const gasVolume = type.volume;
        const cargoCapacity = volume;

        let price = 0;
        let unitsLeft = cargoCapacity / gasVolume;
        for (const order of buyOrders) {
            const amountFromThisOrder = Math.min(order.volume_remain, unitsLeft);

            price += amountFromThisOrder * order.price;
            unitsLeft -= amountFromThisOrder;

            if (!unitsLeft) {
                break;
            }
        }

        if (unitsLeft) {
            this.gasPrices[buySell][gas] = price / unitsLeft;
            return;
        }

        this.gasPrices[buySell][gas] = price / cargoCapacity;
    }

    private async fetchGasTypeInformation() {
        const types = await this.typesService.getTypes(...EVE.gasses.fullerenes, ...EVE.gasses.boosterGasClouds) || [];
        this.gasTypes = objectsArrayToObject(types, 'type_id');
    }

    private getGasName(gas: number) {
        return Gas[gas];
    }
}
