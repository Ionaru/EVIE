import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { IUniverseTypeData, Ore } from '@ionaru/eve-utils';

import { Calc } from '../../../shared/calc.helper';
import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { TypesService } from '../../data-services/types.service';
import { createTitle } from '../../shared/title';

interface IOreTypesDict {
    [index: number]: IUniverseTypeData;
}

interface IMineralData {
    id: number;
    buy: number;
    sell: number;
    profitMoney: number;
    profit: number;
    accurateData?: false;
    name: string;
    index?: number;
}

@Component({
    selector: 'app-refining-profit',
    styleUrls: ['./refining-profit.component.scss'],
    templateUrl: './refining-profit.component.html',
})
export class RefiningProfitComponent implements OnInit {

    public buyRegion = 10000043;
    public sellStation = 30002187;
    public amount = 8000;

    public oreTypes: IOreTypesDict = {};
    public prices: any = {};

    public set: Ore[] = [];

    public visibleData?: IMineralData[];

    public refiningYield = 71;

    public tableSettings: ITableHeader<IMineralData>[] = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="https://images.evetech.net/types/${data.id}/icon?size=32" alt="${data.name}"> `,
        sort: true,
        sortAttribute: 'index',
        title: 'Type',
    }, {
        attribute: 'buy',
        hint: `Average for using sell orders to buy ${this.amount}m³ of ore.`,
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Buy ore price',
    }, {
        attribute: 'sell',
        hint: 'Average for using buy orders to sell all minerals.',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Sell minerals price',
    }, {
        attribute: 'profitMoney',
        classFunction: (data) => data.accurateData === false ? 'text-warning' : (data.profit < 0 ? 'text-danger' : 'text-success'),
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Profit',
    }, {
        attribute: 'profit',
        classFunction: (data) => data.accurateData === false ? 'text-warning' : (data.profit < 0 ? 'text-danger' : 'text-success'),
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' %',
        title: 'Profit',
    }];

    constructor(
        private marketService: MarketService,
        private typesService: TypesService,
        private industryService: IndustryService,
        private title: Title,
    ) { }

    public async ngOnInit() {
        this.title.setTitle(createTitle('Refining Profit'));
        this.getOreInformation(this.set).then();
    }

    // tslint:disable-next-line:cognitive-complexity
    public async getPrices(ore: number, volume: number) {

        // tslint:disable-next-line:no-non-null-assertion
        const oreAmount = volume / this.oreTypes[ore].volume!;
        const orePrice = await this.marketService.getPriceForAmount(this.buyRegion, ore, oreAmount, 'sell');

        if (!orePrice) {
            this.prices[ore].buy = Infinity;
            this.prices[ore].sell = 0;
            this.prices[ore].accurateData = false;
            return;
        }

        this.prices[ore].buy = orePrice;

        const oreMaterials = await this.industryService.getRefiningProducts(ore);

        let totalPrice = 0;

        await Promise.all(oreMaterials.map(async (material) => {

            // tslint:disable-next-line:no-non-null-assertion
            const amount = (material.quantity * (volume / this.oreTypes[ore].volume!)) * (this.refiningYield / 100);
            const materialPrice = await this.marketService.getPriceForAmountInSystem(this.sellStation, material.id, amount, 'buy');

            if (!materialPrice) {
                throw new Error('NOPE');
            }

            totalPrice += materialPrice;
        }));

        this.prices[ore].sell = totalPrice / 100;
    }

    public async getOreInformation(selectedOres: Ore[]) {
        const types = await this.typesService.getTypes(...selectedOres);

        if (!types) {
            throw new Error(`Could not fetch types: ${selectedOres}`);
        }

        for (const ore of selectedOres) {
            // tslint:disable-next-line:no-non-null-assertion
            this.oreTypes[ore] = types.find((type) => type.type_id === ore)!;
        }

        await Promise.all(selectedOres.map(async (ore) => {
            this.prices[ore] = {};
            await this.getPrices(ore, this.amount);
        }));

        this.visibleData = selectedOres.map((ore, index) => {
            return {
                accurateData: this.prices[ore].accurateData,
                buy: this.prices[ore].buy,
                id: ore,
                index,
                name: Ore[ore],
                profit: Calc.profitPercentage(this.prices[ore].buy, this.prices[ore].sell) || -Infinity,
                profitMoney: this.prices[ore].sell - this.prices[ore].buy,
                sell: this.prices[ore].sell,
            };
        });
    }
}
