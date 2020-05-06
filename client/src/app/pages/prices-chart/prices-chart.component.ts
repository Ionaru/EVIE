import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { faCloud, faDiceD6, faDiceD8 } from '@fortawesome/pro-regular-svg-icons';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { Gas, Ice, IMarketOrdersData, IUniverseTypeData, Ore } from '@ionaru/eve-utils';

import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';
import { createTitle } from '../../shared/title';

interface IOreTypesDict {
    [index: number]: IUniverseTypeData;
}

interface IOrePrices {
    buy: IOrePrice;
    sell: IOrePrice;
}

interface IOrePrice {
    [index: number]: number;
}

interface IOresData {
    buy: number;
    id: number;
    index: number;
    name: string;
    sell: number;
    spread: number;
    venture: number;
    volume?: number | string;
}

@Component({
    selector: 'app-ore',
    styleUrls: ['./prices-chart.component.scss'],
    templateUrl: './prices-chart.component.html',
})
export class PricesChartComponent implements OnInit {

    public oreIcon = faDiceD6;
    public iceIcon = faDiceD8;
    public gasIcon = faCloud;

    public oreTypes: IOreTypesDict = {};
    public orePrices: IOrePrices = {
        buy: {},
        sell: {},
    };

    public visibleData?: IOresData[];

    public tableSettings: ITableHeader<IOresData>[] = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="https://images.evetech.net/types/${data.id}/icon?size=32" alt="${data.name}"> `,
        sort: true,
        sortAttribute: 'index',
        suffixFunction: (data) => `<span class="text-muted">${data.volume}m³</span>`,
        title: 'Type',
    }, {
        attribute: 'buy',
        hint: 'Average for using buy orders to sell 5.000m³ of product.',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Buy price / m³',
    }, {
        attribute: 'sell',
        hint: 'Average for using sell orders to buy 5.000m³ of product.',
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
        hint: '5000m³',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Sell price / Venture',
    }];

    public set: Ore[] | Gas[] | Ice[] = [];

    constructor(
        private namesService: NamesService,
        private marketService: MarketService,
        private typesService: TypesService,
        private title: Title,
    ) { }

    public async ngOnInit() {

        this.title.setTitle(createTitle('EVE Online Price Chart'));
        this.getOreInformation(this.set).then();
    }

    public async getPriceForVolume(ore: number, orders: IMarketOrdersData, volume: number, buy = true) {
        const buyOrders = orders.filter((order) => order.is_buy_order === buy);
        sortArrayByObjectProperty(buyOrders, 'price', buy);
        const buySell = buy ? 'buy' : 'sell';

        const type = this.oreTypes[ore];

        if (!type || !type.volume) {
            this.orePrices[buySell][ore] = -1;
            return;
        }

        const oreVolume = type.volume;
        const cargoCapacity = volume;

        let price = 0;
        let unitsLeft = cargoCapacity / oreVolume;
        for (const order of buyOrders) {
            const amountFromThisOrder = Math.min(order.volume_remain, unitsLeft);

            price += amountFromThisOrder * order.price;
            unitsLeft -= amountFromThisOrder;

            if (!unitsLeft) {
                break;
            }
        }

        if (unitsLeft) {
            this.orePrices[buySell][ore] = price / unitsLeft;
            return;
        }

        this.orePrices[buySell][ore] = price / cargoCapacity;
    }

    public async getOreInformation(selectedOres: number[]) {
        await this.namesService.getNames(...selectedOres);

        const types = await this.typesService.getTypes(...selectedOres);

        if (!types) {
            throw new Error(`Could not fetch types: ${selectedOres}`);
        }

        for (const ore of selectedOres) {
            // tslint:disable-next-line:no-non-null-assertion
            this.oreTypes[ore] = types.find((type) => type.type_id === ore)!;
        }

        await Promise.all(selectedOres.map(async (ore) => {
            const orders = await this.marketService.getMarketOrders(10000002, ore);
            if (orders) {
                const jitaOrders = orders.filter((order) => order.location_id === 60003760);
                this.getPriceForVolume(ore, jitaOrders, 5000).then();
                this.getPriceForVolume(ore, jitaOrders, 5000, false).then();
            }
        }));

        this.visibleData = selectedOres.map((ore, index) => {
            return {
                buy: this.orePrices.buy[ore],
                id: ore,
                index,
                name: NamesService.getNameFromData(ore),
                sell: this.orePrices.sell[ore],
                spread: this.orePrices.sell[ore] - this.orePrices.buy[ore],
                venture: this.orePrices.sell[ore] * 5000,
                volume: this.oreTypes[ore].volume,
            };
        });
    }
}
