import { Component } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';

import { Common } from '../../../shared/common.helper';
import { IMarketOrdersReponse } from '../../../shared/interface.helper';
import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';

@Component({
    selector: 'app-ore',
    styleUrls: ['./ore.component.scss'],
    templateUrl: './ore.component.html',
})
export class OreComponent {

    public model = {
        beltVariants: false,
        moonVariants: false,
    };

    public variantsVisibleIcon = faEye;
    public variantsHiddenIcon = faEyeSlash;

    public highSecOres = [1230, 1228, 1224, 18, 1227, 20];
    public highSecOreVariants = [17470, 17471, 17463, 17464, 17459, 17460, 17455, 17456, 17867, 17868, 17452, 17453];
    public highSecOreMoonVariants = [46689, 46687, 46686, 46685, 46684, 46683];
    public lowSecOres = [1226, 1231, 21];
    public lowSecOreVariants = [17448, 17449, 17444, 17445, 17440, 17441];
    public lowSecOreMoonVariants = [46682, 46681, 46680];
    public nullSecOres = [1229, 1232, 19, 1225, 22, 1223, 11396];
    public nullSecOreVariants = [17865, 17866, 17436, 17437, 17466, 17467, 17432, 17433, 17428, 17429, 17425, 17426, 17869, 17870];
    public nullSecOreMoonVariants = [46679, 46675, 46688, 46677, 46676, 46678, 17870];

    public ores = [
        // Base, 5%, 10%, 15% (Moon)
        // HighSec Ores
        1230, 17470, 17471, 46689, // Veldspar
        1228, 17463, 17464, 46687, // Scordite
        1224, 17459, 17460, 46686, // Pyroxeres
        18, 17455, 17456, 46685, // Plagioclase
        1227, 17867, 17868, 46684, // Omber
        20, 17452, 17453, 46683, // Kernite
        // LowSec Ores
        1226, 17448, 17449, 46682, // Jaspet
        1231, 17444, 17445, 46681, // Hemorphite
        21, 17440, 17441, 46680, // Hedbergite
        // NullSec Ores
        1229, 17865, 17866, 46679, // Gneiss
        1232, 17436, 17437, 46675, // Dark Ochre
        19, 17466, 17467, 46688, // Spodumain
        1225, 17432, 17433, 46677, // Crokite
        1223, 17428, 17429, 46676, // Bistot
        22, 17425, 17426, 46678, // Arkonor
        11396, 17869, 17870, // Mercoxit
    ];

    public oreNames: any = {};
    public oreTypes: any = {};
    public orePrices: any = {
        buy: {},
        sell: {},
    };

    public data: any[] = [];
    public visibleData: any[] = [];

    public tableSettings: ITableHeader[] = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="//image.eveonline.com/Type/${data.id}_32.png" alt="${data.name}"> `,
        sort: true,
        sortAttribute: 'index',
        title: 'Type',
    }, {
        attribute: 'buy',
        hint: 'Average for using buy orders to sell 8.000m³ of ore.',
        pipe: 'number',
        pipeVar: '0.0-2',
        sort: true,
        suffix: ' ISK',
        title: 'Buy price / m³',
    }, {
        attribute: 'sell',
        hint: 'Average for using sell orders to buy 8.000m³ of ore.',
        pipe: 'number',
        pipeVar: '0.2-2',
        sort: true,
        suffix: ' ISK',
        title: 'Sell price / m³',
    }];

    constructor(private namesService: NamesService, private marketService: MarketService, private typesService: TypesService) {
        this.getData().then();
    }

    public async getData() {

        await this.namesService.getNames(...this.ores);
        for (const ore of this.ores) {
            this.oreNames[ore] = NamesService.getNameFromData(ore);
        }

        const types = await this.typesService.getTypes(...this.ores);
        for (const ore of this.ores) {
            this.oreTypes[ore] = types ? types[this.ores.indexOf(ore)] : undefined;
        }

        await Promise.all(this.ores.map(async (ore) => {
            const orders: IMarketOrdersReponse[] = [];

            orders.push(...await this.marketService.getMarketOrders(10000002, ore) || []);
            // orders.push(...await this.marketService.getMarketOrders(10000043, ore) || []);

            if (orders) {
                this.getPriceForVolume(orders, 8000).then();
                this.getPriceForVolume(orders, 8000, false).then();
            }
        }));

        this.data = this.ores.map((ore, index) => {
            return {
                buy: this.orePrices.buy[ore],
                id: ore,
                index,
                name: this.oreNames[ore],
                sell: this.orePrices.sell[ore],
            };
        });

        this.changeVisibleOres();
    }

    public async getPriceForVolume(orders: IMarketOrdersReponse[], volume: number, buy = true) {
        const buyOrders = orders.filter((order) => order.is_buy_order === buy);
        Common.sortArrayByObjectProperty(buyOrders, 'price', buy);
        const buySell = buy ? 'buy' : 'sell';

        const type = this.oreTypes[orders[0].type_id];

        if (!type) {
            this.orePrices[buySell][orders[0].type_id] = -1;
            return;
        }

        const veldVolume = type.volume;
        const cargoCap = volume;

        let price = 0;
        let unitsLeft = cargoCap / veldVolume;
        for (const order of buyOrders) {
            const amountFromThisOrder = Math.min(order.volume_remain, unitsLeft);

            price += amountFromThisOrder * order.price;
            unitsLeft -= amountFromThisOrder;

            if (!unitsLeft) {
                break;
            }
        }

        if (unitsLeft) {
            this.orePrices[buySell][orders[0].type_id] = price / unitsLeft;
            return;
        }

        this.orePrices[buySell][orders[0].type_id] = price / cargoCap;
    }

    public changeVisibleOres() {
        if (this.model.beltVariants && this.model.moonVariants) {
            this.visibleData = [...this.data];
        }

        if (this.model.beltVariants && !this.model.moonVariants) {
            const visibleOres2 = [
                ...this.highSecOres,
                ...this.highSecOreVariants,
                ...this.lowSecOres,
                ...this.lowSecOreVariants,
                ...this.nullSecOres,
                ...this.nullSecOreVariants,
            ];

            this.visibleData = [...this.data.filter((ore) => visibleOres2.includes(ore.id))];
        }

        if (!this.model.beltVariants && this.model.moonVariants) {
            const visibleOres2 = [
                ...this.highSecOres,
                ...this.highSecOreMoonVariants,
                ...this.lowSecOres,
                ...this.lowSecOreMoonVariants,
                ...this.nullSecOres,
                ...this.nullSecOreMoonVariants,
            ];

            this.visibleData = [...this.data.filter((ore) => visibleOres2.includes(ore.id))];
        }

        if (!this.model.beltVariants && !this.model.moonVariants) {
            const visibleOres = [...this.highSecOres, ...this.lowSecOres, ...this.nullSecOres];
            this.visibleData = [...this.data.filter((ore) => visibleOres.includes(ore.id))];
        }
    }
}
