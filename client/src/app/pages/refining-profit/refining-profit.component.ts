import { Component, OnInit } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { EVE } from '@ionaru/eve-utils';

import { Calc } from '../../../shared/calc.helper';
import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';

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

    public oreTypes: any = {};
    public prices: any = {};

    public data: any[] = [];
    public visibleData?: any[];

    public refiningYield = 71;

    public tableSettings: Array<ITableHeader<any>> = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="https://images.evetech.net/types/${data.id}/icon?size=32" alt="${data.name}"> `,
        sort: true,
        sortAttribute: 'index',
        title: 'Type',
    }, {
        attribute: 'buy',
        hint: 'Average for using sell orders to buy 8.000m³ of ore.',
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

        // Cache mineral prices ahead of calculations for better performance.
        await Promise.all(EVE.minerals.map(async (mineral) => {
            return this.marketService.getMarketOrders(10000002, mineral, 'buy');
        }));

        await this.namesService.getNames(...EVE.ores.all);

        const types = await this.typesService.getTypes(...EVE.ores.all);
        for (const ore of EVE.ores.all) {
            this.oreTypes[ore] = types ? types.find((type) => type.type_id === ore) : undefined;
        }

        await Promise.all(EVE.ores.all.map(async (ore) => {
            this.prices[ore] = {};
            await this.getPrices(ore, 8000);
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

        const oreSellOrders = await this.marketService.getMarketOrders(10000002, ore, 'sell');

        if (!oreSellOrders || !oreSellOrders.length) {
            this.prices[ore].buy = Infinity;
            this.prices[ore].sell = 0;
            this.prices[ore].accurateData = false;
            return;
        }

        sortArrayByObjectProperty(oreSellOrders, 'price');

        const type = this.oreTypes[ore];

        if (!type) {
            return;
        }

        const oreVolume = type.volume;
        const cargoCap = volume;

        let price = 0;
        let unitsLeft = cargoCap / oreVolume;
        for (const order of oreSellOrders) {
            const amountFromThisOrder = Math.min(order.volume_remain, unitsLeft);

            price += amountFromThisOrder * order.price;
            unitsLeft -= amountFromThisOrder;

            if (!unitsLeft) {
                break;
            }
        }

        if (unitsLeft) {
            this.prices[ore].accurateData = false;
        }

        this.prices[ore].buy = price;

        const oreMaterials = await this.industryService.getRefiningProducts(ore);

        let totalPrice = 0;

        await Promise.all(oreMaterials.map(async (material) => {
            const materialBuyOrders = await this.marketService.getMarketOrders(10000002, material.id, 'buy');
            if (!materialBuyOrders || !materialBuyOrders.length) {
                return;
            }
            sortArrayByObjectProperty(materialBuyOrders, 'price', true);
            let materialPrice = 0;
            let materialUnitsLeft = (material.quantity * ((volume / oreVolume) - unitsLeft)) * (this.refiningYield / 100);
            for (const order of materialBuyOrders) {
                const amountFromThisOrder = Math.min(order.volume_remain, materialUnitsLeft);

                materialPrice += amountFromThisOrder * order.price;
                materialUnitsLeft -= amountFromThisOrder;

                if (!materialUnitsLeft) {
                    break;
                }
            }

            if (unitsLeft) {
                this.prices[ore].accurateData = false;
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
