import { Component, NgZone, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { EVE, IMarketOrdersData, IUniverseTypesData } from '@ionaru/eve-utils';

import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';

interface IOreTypesDict {
    [index: number]: IUniverseTypesData;
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
    volume: number | string;
}

@Component({
    selector: 'app-ore',
    styleUrls: ['./ore.component.scss'],
    templateUrl: './ore.component.html',
})
export class OreComponent implements OnInit {

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

    public oreTypes: IOreTypesDict = {};
    public orePrices: IOrePrices = {
        buy: {},
        sell: {},
    };

    public data: IOresData[] = [];
    public visibleData?: IOresData[];

    public tableSettings: Array<ITableHeader<IOresData>> = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="https://imageserver.eveonline.com/Type/${data.id}_32.png" alt="${data.name}"> `,
        sort: true,
        sortAttribute: 'index',
        suffixFunction: (data) => `<span class="text-muted">${data.volume}m³</span>`,
        title: 'Type',
    }, {
        attribute: 'buy',
        hint: 'Average for using buy orders to sell 5.000m³ of ore.',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Buy price / m³',
    }, {
        attribute: 'sell',
        hint: 'Average for using sell orders to buy 5.000m³ of ore.',
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

    constructor(private namesService: NamesService, private marketService: MarketService, private typesService: TypesService,
                private ngZone: NgZone, private title: Title, private meta: Meta) { }

    public async ngOnInit() {

        this.title.setTitle('EVIE - EVE Online Ore Chart');
        this.meta.addTag({
            description: 'EVIE\'s Ore chart for EVE Online is a live-updated overview of the different ores available in EVE Online and ' +
                'their current market prices.',
            keywords: [
                'EVE Online', 'EVIE',
                'Ore Table', 'Ore Chart', 'Overview',
                'Market', 'Mining', 'Miner', 'Refining', 'ISK', 'Ore', 'Ice', 'Asteroids',
                'Highsec', 'Lowsec', 'Nullsec',
                'Exhumer', 'Hulk', 'Mackinaw', 'Skiff', 'Mining Barge', 'Covetor', 'Retriever', 'Procurer', 'Venture',
                ...Object.keys(EVE.ore), ...Object.keys(EVE.mineral),
            ].join(', '),
        });

        await this.namesService.getNames(...EVE.ores.all);

        const types = await this.typesService.getTypes(...EVE.ores.all) || [];
        for (const ore of EVE.ores.all) {
            this.oreTypes[ore] = types.filter((type) => type.type_id === ore)[0];
        }

        await Promise.all(EVE.ores.all.map(async (ore) => {
            const orders = await this.marketService.getMarketOrders(10000002, ore);
            if (orders) {
                const jitaOrders = orders.filter((order) => order.location_id === 60003760);
                this.getPriceForVolume(ore, jitaOrders, 5000).then();
                this.getPriceForVolume(ore, jitaOrders, 5000, false).then();
            }
        }));

        this.data = EVE.ores.all.map((ore, index) => {
            return {
                buy: this.orePrices.buy[ore],
                id: ore,
                index,
                name: NamesService.getNameFromData(ore),
                sell: this.orePrices.sell[ore],
                spread: this.orePrices.sell[ore] - this.orePrices.buy[ore],
                venture: this.orePrices.sell[ore] * 5000,
                volume: this.oreTypes[ore] ? this.oreTypes[ore].volume : '?',
            };
        });

        this.changeVisibleOres();
    }

    public async getPriceForVolume(ore: number, orders: IMarketOrdersData, volume: number, buy = true) {
        const buyOrders = orders.filter((order) => order.is_buy_order === buy);
        sortArrayByObjectProperty(buyOrders, 'price', buy);
        const buySell = buy ? 'buy' : 'sell';

        const type = this.oreTypes[ore];

        if (!type) {
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

        this.ngZone.run(() => {
            this.visibleData = [...this.data.filter((ore) => visibleOres.includes(ore.id))];
        });
    }
}
