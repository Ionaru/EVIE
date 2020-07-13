import { Component, OnInit } from '@angular/core';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { EVE, IUniverseTypeData, Mineral, Ore } from '@ionaru/eve-utils';

import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { IndustryService, IRefiningProducts } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { TypesService } from '../../data-services/types.service';

interface IData {
    name: string;
    id: number;
    index: number;
    price: number;
    Tritanium: number;
    Pyerite: number;
    Mexallon: number;
    Isogen: number;
    Nocxium: number;
    Zydrine: number;
    Megacyte: number;
    Morphite: number;
}

@Component({
    selector: 'app-ore-contents',
    styleUrls: ['./ore-contents.component.scss'],
    templateUrl: './ore-contents.component.html',
})
export class OreContentsComponent implements OnInit {

    public static readonly noneText = '';
    public static readonly centerClass = 'text-center';

    public message = '';

    public visibleData?: IData[];
    public tableSettings: ITableHeader<IData>[] = [
        {
            attribute: 'name',
            sort: true,
            sortAttribute: 'index',
            prefixFunction: (data) => `<img src="https://images.evetech.net/types/${data.id}/icon?size=32" alt="${data.name}"> `,
        }, {
            attribute: 'price',
            pipe: 'number',
            pipeVar: '0.2-2',
            sort: true,
            suffix: ' ISK',
            title: 'Value',
            hint: 'Estimated Item Value',
        }, {
            attribute: 'Tritanium',
            attributeFunction: (data) => data.Tritanium || OreContentsComponent.noneText,
            classFunction: () => OreContentsComponent.centerClass,
            sort: true,
            title: `<img src="https://images.evetech.net/types/${Mineral.Tritanium}/icon?size=32" alt="Tritanium"> Tritanium`,
            titleClass: OreContentsComponent.centerClass,
        }, {
            attribute: 'Pyerite',
            attributeFunction: (data) => data.Pyerite || OreContentsComponent.noneText,
            classFunction: () => OreContentsComponent.centerClass,
            sort: true,
            title: `<img src="https://images.evetech.net/types/${Mineral.Pyerite}/icon?size=32" alt="Pyerite"> Pyerite`,
            titleClass: OreContentsComponent.centerClass,
        }, {
            attribute: 'Mexallon',
            attributeFunction: (data) => data.Mexallon || OreContentsComponent.noneText,
            classFunction: () => OreContentsComponent.centerClass,
            sort: true,
            title: `<img src="https://images.evetech.net/types/${Mineral.Mexallon}/icon?size=32" alt="Mexallon"> Mexallon`,
            titleClass: OreContentsComponent.centerClass,
        }, {
            attribute: 'Isogen',
            attributeFunction: (data) => data.Isogen || OreContentsComponent.noneText,
            classFunction: () => OreContentsComponent.centerClass,
            sort: true,
            title: `<img src="https://images.evetech.net/types/${Mineral.Isogen}/icon?size=32" alt="Isogen"> Isogen`,
            titleClass: OreContentsComponent.centerClass,
        }, {
            attribute: 'Nocxium',
            attributeFunction: (data) => data.Nocxium || OreContentsComponent.noneText,
            classFunction: () => OreContentsComponent.centerClass,
            sort: true,
            title: `<img src="https://images.evetech.net/types/${Mineral.Nocxium}/icon?size=32" alt="Nocxium"> Nocxium`,
            titleClass: OreContentsComponent.centerClass,
        }, {
            attribute: 'Zydrine',
            attributeFunction: (data) => data.Zydrine || OreContentsComponent.noneText,
            classFunction: () => OreContentsComponent.centerClass,
            sort: true,
            title: `<img src="https://images.evetech.net/types/${Mineral.Zydrine}/icon?size=32" alt="Zydrine"> Zydrine`,
            titleClass: OreContentsComponent.centerClass,
        }, {
            attribute: 'Megacyte',
            attributeFunction: (data) => data.Megacyte || OreContentsComponent.noneText,
            classFunction: () => OreContentsComponent.centerClass,
            sort: true,
            title: `<img src="https://images.evetech.net/types/${Mineral.Megacyte}/icon?size=32" alt="Megacyte"> Megacyte`,
            titleClass: OreContentsComponent.centerClass,
        }, {
            attribute: 'Morphite',
            attributeFunction: (data) => data.Morphite || OreContentsComponent.noneText,
            classFunction: () => OreContentsComponent.centerClass,
            sort: true,
            title: `<img src="https://images.evetech.net/types/${Mineral.Morphite}/icon?size=32" alt="Morphite"> Morphite`,
            titleClass: OreContentsComponent.centerClass,
        },
    ];

    constructor(
        private readonly industryService: IndustryService,
        private readonly marketService: MarketService,
        private readonly typesService: TypesService,
    ) {}

    public async ngOnInit() {
        const ores = [
            ...EVE.ores.belt.highSec,
            ...EVE.ores.belt.lowSec,
            ...EVE.ores.belt.nullSec,
        ];

        const data: IData[] = [];

        const types = await this.typesService.getTypes(...ores);
        if (!types) {
            this.message = 'Unable to fetch information in types.';
            throw new Error(this.message);
        }

        await Promise.all(ores.map(async (ore, index) => {

            const mineralData = {
                name: Ore[ore],
                id: ore,
                index,
            };

            const oreType = types.find((d) => d.type_id === ore);
            if (!oreType) {
                this.message = `Unable to find information on ${Ore[ore]}.`;
                throw new Error(this.message);
            }

            const [itemValue, refiningProducts] = await Promise.all([
                this.marketService.getEstimatedItemValue(ore),
                this.industryService.getRefiningProducts(ore),
            ]);

            const price = (itemValue || 0) / (oreType.volume || 1);

            data.push({
                ...mineralData,
                price,
                Tritanium: this.getMineralAmount(refiningProducts, Mineral.Tritanium, oreType),
                Pyerite: this.getMineralAmount(refiningProducts, Mineral.Pyerite, oreType),
                Mexallon: this.getMineralAmount(refiningProducts, Mineral.Mexallon, oreType),
                Isogen: this.getMineralAmount(refiningProducts, Mineral.Isogen, oreType),
                Nocxium: this.getMineralAmount(refiningProducts, Mineral.Nocxium, oreType),
                Zydrine: this.getMineralAmount(refiningProducts, Mineral.Zydrine, oreType),
                Megacyte: this.getMineralAmount(refiningProducts, Mineral.Megacyte, oreType),
                Morphite: this.getMineralAmount(refiningProducts, Mineral.Morphite, oreType),
            });
        }));

        sortArrayByObjectProperty(data, (item) => item.index);

        this.visibleData = data;
    }

    private getMineralAmount(refiningProducts: IRefiningProducts[], mineral: Mineral, oreType: IUniverseTypeData) {
        const product = refiningProducts.find((refiningProduct) => refiningProduct.id === mineral);
        if (!product) {
            return 0;
        }

        return Math.floor(oreType.volume ? product.quantity / oreType.volume : product.quantity);
    }

}
