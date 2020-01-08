// TODO: Remove line below.
// tslint:disable

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICharacterBlueprintsDataUnit, IUniverseNamesDataUnit, IUniverseTypeData } from '@ionaru/eve-utils';
import { map } from 'rxjs/operators';
// import { Observable, of } from 'rxjs';
// import { catchError, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { Calc } from '../../../shared/calc.helper';
import { BlueprintsService } from '../../data-services/blueprints.service';
import { IManufacturingData, IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
// import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';
import { CharacterService } from '../../models/character/character.service';
// import { SankeyDiagram } from './sankey-diagram';
import { SearchService, SearchType } from '../../data-services/search.service';

class ShoppingList2 {
    public readonly list: IndustryNode[] = [];

    public add(nodeToAdd: IndustryNode) {
        const existingNode = this.list.find((node) => node.product.type_id === nodeToAdd.product.type_id);
        if (existingNode) {
            existingNode.quantity += nodeToAdd.quantity;
            existingNode.price += nodeToAdd.price;
        } else {
            this.list.push(nodeToAdd);
        }
    }
}

class IndustryNode {
    price = Infinity;
    quantity: number;
    acquireMethod?: AcquireMethod;
    product: IUniverseTypeData;
    producePrice = Infinity;
    children: IndustryNode[] = [];


    constructor(product: IUniverseTypeData, quantity: number) {
        this.product = product;
        this.quantity = quantity;
    }
}

enum AcquireMethod {
    PURCHASE,
    PRODUCE,
}

interface IInput {
    data?: IUniverseNamesDataUnit;
    input?: string;
}

@Component({
    selector: 'app-blueprint-calculator',
    styleUrls: ['./blueprint-calculator.component.scss'],
    templateUrl: './blueprint-calculator.component.html',
})
export class BlueprintCalculatorComponent implements OnInit {

    public plotlyData: any;
    public plotlyLayout: any;

    public calculating?: boolean;

    public currentMaterial?: string;

    public item: IInput = {};
    @ViewChild('input_item') inputItemElement!: ElementRef<HTMLInputElement>;

    public tax: number = 0;
    @ViewChild('input_tax') inputTaxElement!: ElementRef<HTMLInputElement>;

    public quantity: number = 1;
    @ViewChild('input_quantity') inputQuantityElement!: ElementRef<HTMLInputElement>;

    public productionSystem: IInput = {};
    @ViewChild('input_production_system') inputProductionSystem!: ElementRef<HTMLInputElement>;

    public sellSystem: IInput = {};
    @ViewChild('input_sell_system') inputSellSystemElement!: ElementRef<HTMLInputElement>;

    public buySystem: IInput = {};
    @ViewChild('input_buy_system') inputBuySystemElement!: ElementRef<HTMLInputElement>;

    public profitPercentage = 0;
    public profit = 0;
    public chain?: IndustryNode;

    public shoppingList = new ShoppingList2();
    public shoppingVolume = 0;

    public usedBlueprints: ICharacterBlueprintsDataUnit[] = [];

    public message?: string;

    // public typeSearch = (text$: Observable<string>) => {
    //     return this.searcher(text$, 'type');
    // };
    //
    // public regionSearch = (text$: Observable<string>) => {
    //     return this.searcher(text$, 'system');
    // };

    // public searcher(text$: Observable<string>, searchType: SearchType) {
    //     return text$?.pipe(
    //         debounceTime(200),
    //         distinctUntilChanged(),
    //         switchMap((searchText) =>
    //             this.searchService.search(searchText, searchType).pipe(
    //                 catchError(() => of(['Nothing found']))
    //             )
    //         ),
    //         map((res) => [Array.isArray(res) ? res[0] : res.data])
    //     );
    // }

    constructor(
        private blueprintsService: BlueprintsService,
        private industryService: IndustryService,
        private marketService: MarketService,
        // private namesService: NamesService,
        private searchService: SearchService,
        private typesService: TypesService,
        private route: ActivatedRoute,
        private router: Router,
    ) { }

    public async ngOnInit() {
        this.route.queryParamMap.pipe(map(
            (params) => {
                this.sellSystem.input = params.get('sellSystem') || 'Jita';
                this.buySystem.input = params.get('buySystem') || 'Jita';
                this.item.input = params.get('item') || '';
            })
        ).toPromise().then();
    }

    public resultFormatNameData(value: any): string {
        return typeof value === 'string' ? value : value?.name;
    }

    public inputFormatNameData(value: any): string {
        return value.name ? value.name : value;
    }

    public setPlotlyBackground = () => 'transparent';

    public loggedIn = !!CharacterService.selectedCharacter;

    public async adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData: IManufacturingData) {
        if (!CharacterService.selectedCharacter) {
            return;
        }

        const blueprints = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter);
        const subBlueprint = blueprints.find((blueprint) => blueprint.type_id === manufacturingData.blueprintId);

        if (subBlueprint) {
            this.usedBlueprints.push(subBlueprint);

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

    public flatten<T>(array: T[], childSelector: (element: T) => T[]): T[] {
        return array.reduce((accumulator: T[], currentValue) => {
            accumulator = accumulator.concat(currentValue);
            const children = childSelector(currentValue);
            if (children) {
                accumulator = accumulator.concat(this.flatten(children, childSelector));
            }
            return accumulator;
        }, []);
    }

    public async createSupplyChain3(material: number, quantity = 1, initialPrice?: number) {
        const info = await this.typesService.getType(material);
        if (!info) {
            throw new Error('Unable to get material info');
        }

        this.currentMaterial = info.name;
        const node = new IndustryNode(info, quantity);

        let price;
        if (initialPrice) {
            price = initialPrice;
        } else {
            price = await this.marketService.getPriceForAmountInSystem(this.buySystem.data!.id, material, quantity, 'sell');
        }

        const manufacturingData = await this.industryService.getManufacturingData(material);

        if (!manufacturingData && (!price || price === Infinity)) {
            throw new Error(`Material ${info.name} can neither be bought nor built.`)
        }

        node.price = price || Infinity;

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
        if (materialPrices < node.price) {
            node.acquireMethod = AcquireMethod.PRODUCE;
        } else {
            node.acquireMethod = AcquireMethod.PURCHASE;
            delete node.children;
        }

        return node;
    }

    public async processInput() {

        const results = await Promise.all([
            await this.processInputElement(this.inputItemElement, this.item, 'type'),
            await this.processInputElement(this.inputSellSystemElement, this.sellSystem, 'system'),
            await this.processInputElement(this.inputBuySystemElement, this.buySystem, 'system'),
        ]);

        if (results.every((result) => result)) {
            this.recFun2();
        }
    }

    public async processInputElement(element: ElementRef<HTMLInputElement>, thing: IInput, searchType: SearchType) {

        if (thing.data && thing.data.name === thing.input) {
            return true;
        }

        this.setValidity(element);
        thing.data = undefined;

        if (!thing.input || !thing.input.length) {
            return;
        }

        const result = await this.searchService.search(thing.input, searchType);
        if (!result || !result.id) {
            this.setValidity(element, false);
            return;
        }

        thing.data = result;
        thing.input = result.name;
        this.setValidity(element, true);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                item: this.item.input,
                sellSystem: this.sellSystem.input,
                buySystem: this.buySystem.input,
            },
            queryParamsHandling: 'merge'
        }).then();
        return true;
    }

    public setValidity(element: ElementRef<HTMLInputElement>, valid?: boolean) {

        const invalidClass = 'is-invalid';
        const validClass = 'is-valid';

        // Reset
        element.nativeElement.classList.remove(invalidClass);
        element.nativeElement.classList.remove(validClass);

        if (valid === true) {
            element.nativeElement.classList.add(validClass);
            return;
        }

        if (valid === false) {
            element.nativeElement.classList.add(invalidClass);
        }
    }

    public async recFun2() {

        if (!this.item.data?.id || !this.sellSystem.data?.id || !this.buySystem.data?.id) {
            return;
        }

        this.chain = undefined;
        this.message = undefined;
        this.calculating = true;
        this.shoppingList = new ShoppingList2();
        this.shoppingVolume = 0;
        this.usedBlueprints = [];
        this.currentMaterial = 'Initializing';

        // NEW
        const productPrice = await this.marketService.getPriceForAmountInSystem(this.sellSystem.data.id, this.item.data.id, this.quantity, 'buy');

        if (!productPrice) {
            this.message = 'Unable to determine price for final product.';
            this.calculating = false;
            return;
        }

        const chain = await this.createSupplyChain3(this.item.data.id, this.quantity, productPrice).catch((error: Error) => {
            this.message = `Cannot complete calculation, reason: ${error.message}`;
        });

        if (chain) {
            this.calculating = false;

            this.chain = chain;

            this.profit = chain.price - chain.producePrice;
            this.profitPercentage = Calc.profitPercentage(chain.producePrice, chain.price);

            const flatChain = this.flatten([chain], (industryNode) => industryNode.children);

            for (const node of flatChain) {
                if (node.acquireMethod === AcquireMethod.PURCHASE) {
                    this.shoppingList.add(node);
                }
            }
            this.shoppingVolume = this.shoppingList.list.reduce(
                (accumulator, node) => accumulator + ((node.product.volume || 0) * node.quantity), 0);

        }

        // this.worthToProduce = chain

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
}
