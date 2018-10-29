import { Component, OnInit } from '@angular/core';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';

import { Common } from '../../../shared/common.helper';
import { IMarketOrdersReponse } from '../../../shared/interface.helper';
import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';

@Component({
    selector: 'app-ore',
    styleUrls: ['./minerals.component.scss'],
    templateUrl: './minerals.component.html',
})
export class MineralsComponent implements OnInit {

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

    public oreTypes: any = {};
    public orePrices: any = {
        buy: {},
        sell: {},
    };
    public p: any = {};

    public data: any[] = [];
    public visibleData: any[] = [];

    public tableSettings: ITableHeader[] = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="//image.eveonline.com/Type/${data.id}_32.png" alt="${data.name}"> `,
        sort: true,
        sortAttribute: 'index',
        title: 'Ore',
    }, {
        attribute: '34',
        pipe: 'number',
        sort: true,
        title: '<img src="//image.eveonline.com/Type/34_32.png" alt="Tritanium"> Tritanium',
    }, {
        attribute: '35',
        pipe: 'number',
        sort: true,
        title: '<img src="//image.eveonline.com/Type/35_32.png" alt="Pyerite"> Pyerite',
    }, {
        attribute: '36',
        pipe: 'number',
        sort: true,
        title: '<img src="//image.eveonline.com/Type/36_32.png" alt="Mexallon"> Mexallon',
    }, {
        attribute: '37',
        pipe: 'number',
        sort: true,
        title: '<img src="//image.eveonline.com/Type/37_32.png" alt="Isogen"> Isogen',
    }, {
        attribute: '38',
        pipe: 'number',
        sort: true,
        title: '<img src="//image.eveonline.com/Type/38_32.png" alt="Nocxium"> Nocxium',
    }, {
        attribute: '39',
        pipe: 'number',
        sort: true,
        title: '<img src="//image.eveonline.com/Type/39_32.png" alt="Zydrine"> Zydrine',
    }, {
        attribute: '40',
        pipe: 'number',
        sort: true,
        title: '<img src="//image.eveonline.com/Type/40_32.png" alt="Megacyte"> Megacyte',
    }, {
        attribute: '11399',
        pipe: 'number',
        sort: true,
        title: '<img src="//image.eveonline.com/Type/11399_32.png" alt="Morphite"> Morphite',
    }];

    constructor(private namesService: NamesService, private marketService: MarketService, private typesService: TypesService,
                private industryService: IndustryService) { }

    public async ngOnInit() {

        const ores = this.getVisibleOres();

        await this.namesService.getNames(...ores);

        const types = await this.typesService.getTypes(...ores);
        for (const ore of ores) {
            if (!this.oreTypes[ore]) {
                this.oreTypes[ore] = types ? types.filter((type) => type.type_id === ore)[0] : undefined;
            }
        }

        await Promise.all(ores.map(async (ore) => {
            this.p[ore] = await this.getMinerals(ore);
        }));

        this.data = this.ores.map((ore, index) => {
            const d = this.p[ore];
            if (d) {
                d.id = ore;
                d.index = index;
                d.name = NamesService.getNameFromData(ore);
                return d;
            }
        });

        this.visibleData = ores.length !== this.data.length ? [...this.data.filter((ore) => ore && ores.includes(ore.id))] : this.data;
    }

    public async getMinerals(ore: number) {
        const products = await this.industryService.getReprocessingProducts(ore);

        if (!products) {
            return;
        }

        const minerals: any = {};

        for (const mineral of [34, 35, 36, 37, 38, 39, 40, 11399]) {
            const productForMineral = products.filter((product) => product.id === mineral)[0];
            minerals[mineral] = productForMineral ? (productForMineral.quantity / this.oreTypes[ore].volume) : 0;
        }

        return minerals;
    }

    public getVisibleOres() {
        const vis: number[] = [];

        if (this.model.highSecOres && this.model.regularOres) {
            vis.push(...this.highSecOres);
        }

        if (this.model.highSecOres && this.model.beltVariants) {
            vis.push(...this.highSecOreVariants);
        }

        if (this.model.highSecOres && this.model.moonVariants) {
            vis.push(...this.highSecOreMoonVariants);
        }

        if (this.model.lowSecOres && this.model.regularOres) {
            vis.push(...this.lowSecOres);
        }

        if (this.model.lowSecOres && this.model.beltVariants) {
            vis.push(...this.lowSecOreVariants);
        }

        if (this.model.lowSecOres && this.model.moonVariants) {
            vis.push(...this.lowSecOreMoonVariants);
        }

        if (this.model.nullSecOres && this.model.regularOres) {
            vis.push(...this.nullSecOres);
        }

        if (this.model.nullSecOres && this.model.beltVariants) {
            vis.push(...this.nullSecOreVariants);
        }

        if (this.model.nullSecOres && this.model.moonVariants) {
            vis.push(...this.nullSecOreMoonVariants);
        }

        return vis;
    }

    public async changeVisibleOres() {
        await this.ngOnInit();
    }
}
