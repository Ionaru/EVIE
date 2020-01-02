// TODO: Remove line below.
// tslint:disable

import { Component, OnInit } from '@angular/core';

// import { Calc } from '../../../shared/calc.helper';
import { BlueprintsService } from '../../data-services/blueprints.service';
import { IManufacturingData, IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';
import { CharacterService } from '../../models/character/character.service';
// import { SankeyDiagram } from './sankey-diagram';
import { Observable } from 'rxjs';
// @ts-ignore
import { catchError, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { SearchService } from '../../data-services/search.service';
import { IUniverseNamesDataUnit } from '@ionaru/eve-utils';

interface IUsedBlueprints {
    0: number;
    1: number;
}

class ShoppingList {

    public readonly list: xxx = {};

    public volume = 0;

    public add(id: number, quantity: number) {
        if (this.list[id]) {
            this.list[id] += quantity;
        } else {
            this.list[id] = quantity;
        }
    }

    public merge(shoppingList: ShoppingList, amount = 1) {
        for (const id in shoppingList.list) {
            if (shoppingList.list.hasOwnProperty(id)) {
                this.add(Number(id), shoppingList.list[id] * amount);
            }
        }
    }
}

class IndustryNode {
    price = 0;
    quantity?: number;
    acquireMethod?: AcquireMethod;
    product?: number;
    producePrice?: number;
    children: IndustryNode[] = [];
}

enum AcquireMethod {
    PURCHASE,
    PRODUCE,
}

@Component({
    selector: 'app-blueprint-calculator',
    styleUrls: ['./blueprint-calculator.component.scss'],
    templateUrl: './blueprint-calculator.component.html',
})
export class BlueprintCalculatorComponent implements OnInit {

    public baseMats: string[] = [];
    public bups: yyy = {};

    public plotlyData: any;
    public plotlyLayout: any;

    public calculating?: boolean;

    public currentMaterial?: string;
    public worthToProduce = false;

    public selectedItem?: IUniverseNamesDataUnit;
    public profit = 0;

    public shoppingList = new ShoppingList();

    public usedBlueprints: IUsedBlueprints[] = [];

    public characterNames = (text$: Observable<string>) => {
        return text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            // map((q) => ['1', '2', q])
            switchMap((searchText) =>  this.searchService.searchType(searchText)),
            catchError(() => ['Not found']),
            map((res) => [typeof res === 'string' ? res : res.data])
        );
    };

    constructor(
        private blueprintsService: BlueprintsService,
        private industryService: IndustryService,
        private marketService: MarketService,
        private namesService: NamesService,
        // @ts-ignore
        private searchService: SearchService,
        private typesService: TypesService,
    ) { }

    public ngOnInit() {
        this.bups = {};
        this.baseMats = [];

        // const item = 11393; // Retribution
        // const item = 25898; // Large Nanobot Accelerator I
        // const item = 40340; // Keepstar
        // const item = 12003; // Zealot
        // const item = 11365; // Vengeance
        // const item = 11184; // Crusader
        // const item = 578; // adaptive invul field I
        //
        // this.recFun(item).then();
        // this.recFun2(item).then();
    }

    public resultFormatBandListValue(value: IUniverseNamesDataUnit | string) {
        return typeof value === 'string' ? value : value?.name;
    }

    public inputFormatBandListValue(value: IUniverseNamesDataUnit | undefined)   {
        if(value?.name)
            return value.name;
        return value;
    }

    public setPlotlyBackground = () => 'transparent';

    public getName = (id: number | string) => NamesService.getNameFromData(Number(id));

    public bupKeys = () => Object.keys(this.bups);

    public async adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData: IManufacturingData) {
        const blueprints = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter!);
        const subBlueprint = blueprints.find((blueprint) => blueprint.type_id === manufacturingData.blueprintId);

        if (subBlueprint) {
            this.usedBlueprints.push([subBlueprint.type_id, subBlueprint.material_efficiency]);

            manufacturingData.materials = manufacturingData.materials.map((material) => {

                const materialMultiplier = subBlueprint.material_efficiency / 100;
                const materialsToSubtract = material.quantity * materialMultiplier;

                return {
                    id: material.id,
                    quantity: Math.ceil(material.quantity - materialsToSubtract)
                }
            });

        }
        return manufacturingData;
    }

    public async createSupplyChain3(material: number, quantity = 1, initialPrice?: number) {
        this.currentMaterial = material.toString();
        const marketRegion = 10000043; // Domain
        const node = new IndustryNode();
        node.product = material;
        node.quantity = quantity;

        let price;
        if (initialPrice) {
            price = initialPrice;
        } else {
            price = await this.marketService.getPriceForAmount(marketRegion, material, quantity, 'buy');
        }

        const manufacturingData = await this.industryService.getManufacturingData(material);
        const info = await this.typesService.getType(material);

        if (!manufacturingData && (!price || price === Infinity)) {
            throw new Error(`Material ${material} can neither be bought or build.`)
        }

        if (!info || !price) {
            throw new Error('Unable to get material info');
        }

        node.price = price;

        if (!manufacturingData) {
            // Item can not be produced.
            node.acquireMethod = AcquireMethod.PURCHASE;
            delete node.children;
            return node;
        }

        let materialPrices = 0;
        await this.adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData);

        for (const subMaterial of manufacturingData.materials) {
            const subNode = await this.createSupplyChain3(subMaterial.id, subMaterial.quantity * quantity);
            materialPrices += subNode.price;
            node.children.push(subNode);
        }

        node.producePrice = materialPrices;
        if (materialPrices < price) {
            node.acquireMethod = AcquireMethod.PRODUCE;
        } else {
            node.acquireMethod = AcquireMethod.PURCHASE;
            delete node.children;
        }

        return node;
    }

    public async recFun2() {

        const m = this.selectedItem?.id;

        if (!m) {
            return;
        }

        this.calculating = true;
        this.shoppingList = new ShoppingList();
        this.usedBlueprints = [];
        this.currentMaterial = 'Initializing';

        // const marketRegion = 10000002; // The Forge
        const marketRegion = 10000043; // Domain

        // NEW
        const productInfo = await this.typesService.getTypes(m);
        const productPrice = await this.marketService.getPriceForAmount(marketRegion, m, 1, 'sell');

        if (!productInfo || !productInfo[0] || !productPrice) {
            throw new Error('Unable to determine info');
        }

        // const chain = await this.createSupplyChain2(m);

        const chain = await this.createSupplyChain3(m, 1, productPrice);
        console.dir(chain);

        // Legacy
        // const diagram = new SankeyDiagram({}, {
        //     orientation: 'h',
        // });
        //
        // const extraTypesToGet = [m];
        //
        // const manufacturingData = await this.industryService.getManufacturingData(m);
        // if (!manufacturingData) {
        //     return;
        // }
        //
        // const materials = await this.adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData);
        //
        // await this.namesService.getNames(m, ...materials.materials.map((material) => material.id));
        //
        // let totalPrice = 0;
        //
        // for (const material of materials.materials) {
        //     this.currentMaterial = NamesService.getNameFromData(material.id);
        //     console.log(this.currentMaterial);
        //     const price = await this.marketService.getPriceForAmount(marketRegion, material.id, material.quantity, 'sell');
        //
        //     if (!price) {
        //         throw new Error(`Price not found for ${material.id}`);
        //     }
        //
        //     const subMatData = await this.industryService.getManufacturingData(material.id);
        //
        //     let materialPrices = 0;
        //
        //     if (!subMatData) {
        //         // Can't be produced.
        //         totalPrice += price;
        //         diagram.addLink(material.id.toString(), m.toString(), price);
        //         this.shoppingList.add(material.id, material.quantity);
        //     } else {
        //
        //         const subMaterials = await this.adjustMaterialsNeededByBlueprintMaterialEfficiency(subMatData);
        //
        //         const subMatShoppingList = new ShoppingList();
        //
        //         for (const subMat of subMaterials.materials) {
        //             const subPrice = await this.marketService.getPriceForAmount(marketRegion, subMat.id, subMat.quantity, 'buy');
        //
        //             subMatShoppingList.add(subMat.id, subMat.quantity);
        //
        //             if (subPrice) {
        //                 materialPrices += subPrice;
        //             } else {
        //                 materialPrices = Infinity;
        //                 break;
        //             }
        //         }
        //
        //         if (materialPrices && (materialPrices * material.quantity) < price) {
        //             // Cheaper to produce.
        //             totalPrice += (materialPrices * material.quantity);
        //             for (const id in subMatShoppingList.list) {
        //                 if (subMatShoppingList.list.hasOwnProperty(id)) {
        //                     const xPrice = await this.marketService.getPriceForAmount(marketRegion, Number(id), subMatShoppingList.list[id] * material.quantity, 'sell');
        //                     diagram.addLink(id.toString(), material.id.toString(), xPrice || 0);
        //                 }
        //             }
        //             extraTypesToGet.push(material.id);
        //             diagram.addLink(material.id.toString(), m.toString(), materialPrices * material.quantity);
        //             this.shoppingList.merge(subMatShoppingList, material.quantity);
        //
        //         } else {
        //             // Cheaper to buy
        //             totalPrice += price;
        //             diagram.addLink(material.id.toString(), m.toString(), price);
        //             this.shoppingList.add(material.id, material.quantity);
        //         }
        //     }
        // }
        //
        // this.currentMaterial = 'Finishing up';
        //
        // if (productPrice) {
        //
        //     const types = Object.keys(this.shoppingList.list).map((key) => Number(key));
        //
        //     const typeInfo = (await Promise.all([
        //         this.typesService.getTypes(...types),
        //         this.namesService.getNames(...types, ...extraTypesToGet),
        //     ]))[0];
        //
        //     if (typeInfo) {
        //         this.shoppingList.volume = typeInfo.reduce((accumulator, type) => accumulator + (type.volume! * this.shoppingList.list[type.type_id]), 0)
        //     }
        //
        //     const labels = diagram.data.node.label;
        //     for (const label of labels) {
        //         const index = diagram.data.node.label.indexOf(label);
        //         diagram.data.node.label[index] = NamesService.getNameFromData(label);
        //     }
        //
        //     console.log(totalPrice, productPrice);
        //
        //     this.worthToProduce = totalPrice < productPrice;
        //     this.profit = Calc.profitPercentage(totalPrice, productPrice);
        //
        //     console.log((totalPrice < productPrice ? '' : 'NOT ') + 'WORTH TO PRODUCE');
        //     console.log(Calc.profitPercentage(totalPrice, productPrice) + ' % profit');
        //
        //     this.plotlyLayout = diagram.layout;
        //     this.plotlyData = [diagram.data];
        // }

        this.calculating = false;
    }

    public async recFun(m = 11184) {
        const i = await this.industryService.getManufacturingData(m);
        if (!i) {
            return;
        }

        this.bups[0] = [m];

        let bupcCount = 1;

        const matob: xxx = {};

        // this.bpMats = i.materials.map((h) => h.id);

        const materials = i.materials;

        this.bups[bupcCount] = i.materials.map((b) => b.id);

        for (const mat of materials) {
            matob[mat.id] = mat.quantity;
        }

        const bp = [];

        let matsLeft = true;

        while (matsLeft) {

            matsLeft = false;

            for (const [id, quantity] of Object.entries(matob)) {
                const j = await this.industryService.getManufacturingData(Number(id));
                if (j) {
                    for (const mat of j.materials) {
                        const q = mat.quantity * quantity;
                        matob[mat.id] = matob[mat.id] ? matob[mat.id] + q : q;
                    }
                    matsLeft = true;
                    bp.push(j.blueprintId.toString());
                    delete matob[id];
                }
            }

            if (matsLeft) {
                bupcCount++;
                this.bups[bupcCount] = Object.keys(matob).map((z) => Number(z));
            }
        }

        this.baseMats.push(...Object.keys(matob));
        this.baseMats.push(...bp);

        await this.namesService.getNames(...Object.keys(matob));

        const matob2: xxx = {};
        for (const id of Object.keys(matob)) {
            matob2[NamesService.getNameFromData(Number(id))] = matob[id];
        }
    }
}

interface xxx {
    [index: string]: number;
}

interface yyy {
    [index: string]: number[];
}
