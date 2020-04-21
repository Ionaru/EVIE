import { Component, OnInit } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { EVE } from '@ionaru/eve-utils';

import { Calc } from '../../../shared/calc.helper';
import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';

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

    public model = {
        beltVariants: false,
        highSecOres: true,
        lowSecOres: true,
        moonVariants: false,
        nullSecOres: true,
        regularOres: true,
    };

    public variantsVisibleIcon = faEye;
    public variantsHiddenIcon = faEyeSlash;

    public buyRegion = 10000043;
    public sellStation = 30002187;
    public amount = 8000;

    public oreTypes: any = {};
    public prices: any = {};

    public data: IMineralData[] = [];
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

    constructor(private namesService: NamesService, private marketService: MarketService, private typesService: TypesService,
                private industryService: IndustryService) { }

    public async ngOnInit() {

        this.visibleData = undefined;

        await this.namesService.getNames(...EVE.ores.all);

        const types = await this.typesService.getTypes(...EVE.ores.all);
        for (const ore of EVE.ores.all) {
            this.oreTypes[ore] = types ? types.find((type) => type.type_id === ore) : undefined;
        }

        await Promise.all(EVE.ores.all.map(async (ore) => {
            this.prices[ore] = {};
            await this.getPrices(ore, this.amount);
        }));

        this.data = EVE.ores.all.map((ore, index) => {
            return {
                accurateData: this.prices[ore].accurateData,
                buy: this.prices[ore].buy,
                id: ore,
                index,
                name: NamesService.getNameFromData(ore),
                profit: Calc.profitPercentage(this.prices[ore].buy, this.prices[ore].sell) || -Infinity,
                profitMoney: this.prices[ore].sell - this.prices[ore].buy,
                sell: this.prices[ore].sell,
            };
        });

        this.changeVisibleOres();
    }

    // tslint:disable-next-line:cognitive-complexity
    public async getPrices(ore: number, volume: number) {

        const oreAmount = volume / this.oreTypes[ore].volume;
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

            const amount = (material.quantity * (volume / this.oreTypes[ore].volume)) * (this.refiningYield / 100);
            const materialPrice = await this.marketService.getPriceForAmountInSystem(this.sellStation, material.id, amount, 'buy');

            if (!materialPrice) {
                throw new Error('NOPE');
            }

            totalPrice += materialPrice;
        }));

        this.prices[ore].sell = totalPrice / 100;
    }

    // tslint:disable-next-line:cognitive-complexity
    public changeVisibleOres() {
        const visibleOres: number[] = [];

        if (this.model.highSecOres && this.model.regularOres) {
            visibleOres.push(...EVE.ores.highSec.base);
        }

        if (this.model.highSecOres && this.model.beltVariants) {
            visibleOres.push(...EVE.ores.highSec.beltVariants);
        }

        if (this.model.highSecOres && this.model.moonVariants) {
            visibleOres.push(...EVE.ores.highSec.moonVariants);
        }

        if (this.model.lowSecOres && this.model.regularOres) {
            visibleOres.push(...EVE.ores.lowSec.base);
        }

        if (this.model.lowSecOres && this.model.beltVariants) {
            visibleOres.push(...EVE.ores.lowSec.beltVariants);
        }

        if (this.model.lowSecOres && this.model.moonVariants) {
            visibleOres.push(...EVE.ores.lowSec.moonVariants);
        }

        if (this.model.nullSecOres && this.model.regularOres) {
            visibleOres.push(...EVE.ores.nullSec.base);
        }

        if (this.model.nullSecOres && this.model.beltVariants) {
            visibleOres.push(...EVE.ores.nullSec.beltVariants);
        }

        if (this.model.nullSecOres && this.model.moonVariants) {
            visibleOres.push(...EVE.ores.nullSec.moonVariants);
        }

        if (visibleOres.length === this.data.length) {
            this.visibleData = this.data;
        }

        this.visibleData = [...this.data.filter((ore) => visibleOres.includes(ore.id))];
    }
}
