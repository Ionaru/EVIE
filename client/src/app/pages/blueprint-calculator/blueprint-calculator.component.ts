// TODO: Remove line below.
// tslint:disable

import { Component, OnInit } from '@angular/core';

import { Calc } from '../../../shared/calc.helper';
import { BlueprintsService } from '../../data-services/blueprints.service';
import { IManufacturingData, IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';
import { CharacterService } from '../../models/character/character.service';
import { SankeyDiagram } from './sankey-diagram';

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

class SupplyChain {
    product: number;
    readonly links: SupplyChainLink[] = [];

    constructor(product: number) {
        this.product = product;
    }
}

class SupplyChainLink {
    product: number;
    acquireMethod: AcquireMethod;
    price?: number;
    supplyChain?: SupplyChain;

    constructor(product: number, acquireMethod: AcquireMethod) {
        this.product = product;
        this.acquireMethod = acquireMethod;
    }
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

    public currentMaterial?: string;

    public readonly shoppingList = new ShoppingList();

    constructor(
        private blueprintsService: BlueprintsService,
        private industryService: IndustryService,
        private marketService: MarketService,
        private namesService: NamesService,
        private typesService: TypesService,
    ) { }

    public ngOnInit() {
        this.bups = {};
        this.baseMats = [];

        // const item = 11393; // Retribution
        // const item = 25898; // Large Nanobot Accelerator I
        // const item = 40340; // Keepstar
        const item = 12003; // Zealot
        // const item = 11365; // Vengeance
        // const item = 11184; // Crusader
        //
        // this.recFun(item).then();
        this.recFun2(item).then();
    }

    public setPlotlyBackground = () => 'transparent';

    public getName = (id: number | string) => NamesService.getNameFromData(Number(id));

    public bupKeys = () => Object.keys(this.bups);

    public async adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData: IManufacturingData) {
        const blueprints = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter!);
        const subBlueprint = blueprints.find((blueprint) => blueprint.type_id === manufacturingData.blueprintId);

        if (subBlueprint) {
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

    public async createSupplyChain2(material: number, quantity = 1) {
        const marketRegion = 10000043; // Domain
        const supplyChain = new SupplyChain(material);
        const materialPrice = await this.marketService.getPriceForAmount(marketRegion, material, quantity, 'buy');
        const materialManufacturingData = await this.industryService.getManufacturingData(material);
        const materialInfo = await this.typesService.getType(material);

        if (!materialManufacturingData && (!materialPrice || materialPrice === Infinity)) {
            throw new Error(`Material ${material} can neither be bought or build.`)
        }

        if (!materialInfo || !materialPrice) {
            throw new Error('Unable to get material info');
        }

        if (!materialManufacturingData) {
            // Item can not be produced.
            const chainLink = new SupplyChainLink(material, AcquireMethod.PURCHASE);
            chainLink.price = materialPrice;
            supplyChain.links.push(chainLink);
            return supplyChain;
        }

        for (const subMaterial of materialManufacturingData.materials) {
            const s = new SupplyChainLink(material, AcquireMethod.PRODUCE);
            s.supplyChain = await this.createSupplyChain2(subMaterial.id, subMaterial.quantity * quantity);
            supplyChain.links.push(s);
        }

        return supplyChain;
    }

    public async recFun2(m = 11184) {

        // const marketRegion = 10000002; // The Forge
        const marketRegion = 10000043; // Domain

        // NEW
        const productInfo = await this.typesService.getTypes(m);
        const productPrice = await this.marketService.getPriceForAmount(marketRegion, m, 1, 'sell');

        if (!productInfo || !productInfo[0] || !productPrice) {
            throw new Error('Unable to determine info');
        }

        await this.createSupplyChain2(m);

        // Legacy
        const diagram = new SankeyDiagram({}, {
            orientation: 'h',
        });

        const extraTypesToGet = [m];

        const manufacturingData = await this.industryService.getManufacturingData(m);
        if (!manufacturingData) {
            return;
        }

        const materials = await this.adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData);

        await this.namesService.getNames(...materials.materials.map((material) => material.id));

        let totalPrice = 0;

        for (const material of materials.materials) {
            this.currentMaterial = NamesService.getNameFromData(material.id);
            const price = await this.marketService.getPriceForAmount(marketRegion, material.id, material.quantity, 'buy');

            if (!price) {
                throw new Error(`Price not found for ${material.id}`);
            }

            const subMatData = await this.industryService.getManufacturingData(material.id);

            let materialPrices = 0;

            if (!subMatData) {
                // Can't be produced.
                totalPrice += price;
                diagram.addLink(material.id.toString(), m.toString(), price);
                this.shoppingList.add(material.id, material.quantity);
            } else {

                const subMaterials = await this.adjustMaterialsNeededByBlueprintMaterialEfficiency(subMatData);

                const subMatShoppingList = new ShoppingList();

                for (const subMat of subMaterials.materials) {
                    const subPrice = await this.marketService.getPriceForAmount(marketRegion, subMat.id, subMat.quantity, 'buy');

                    subMatShoppingList.add(subMat.id, subMat.quantity);

                    if (subPrice) {
                        materialPrices += subPrice;
                    } else {
                        materialPrices = Infinity;
                        break;
                    }
                }

                if (materialPrices && (materialPrices * material.quantity) < price) {
                    // Cheaper to produce.
                    totalPrice += (materialPrices * material.quantity);
                    for (const id in subMatShoppingList.list) {
                        if (subMatShoppingList.list.hasOwnProperty(id)) {
                            const xPrice = await this.marketService.getPriceForAmount(marketRegion, Number(id), subMatShoppingList.list[id] * material.quantity, 'buy');
                            diagram.addLink(id.toString(), material.id.toString(), xPrice || 0);
                        }
                    }
                    extraTypesToGet.push(material.id);
                    diagram.addLink(material.id.toString(), m.toString(), materialPrices * material.quantity);
                    this.shoppingList.merge(subMatShoppingList, material.quantity);

                } else {
                    // Cheaper to buy
                    totalPrice += price;
                    diagram.addLink(material.id.toString(), m.toString(), price);
                    this.shoppingList.add(material.id, material.quantity);
                }
            }
        }

        const itemPrice = await this.marketService.getPriceForAmount(marketRegion, m, 1, 'sell');

        if (itemPrice) {

            const types = Object.keys(this.shoppingList.list).map((key) => Number(key));

            const typeInfo = (await Promise.all([
                this.typesService.getTypes(...types),
                this.namesService.getNames(...types, ...extraTypesToGet),
            ]))[0];

            if (typeInfo) {
                this.shoppingList.volume = typeInfo.reduce((accumulator, type) => accumulator + (type.volume! * this.shoppingList.list[type.type_id]), 0)
            }

            const labels = diagram.data.node.label;
            for (const label of labels) {
                const index = diagram.data.node.label.indexOf(label);
                diagram.data.node.label[index] = NamesService.getNameFromData(label);
            }

            console.log(totalPrice, itemPrice);
            console.log((totalPrice < itemPrice ? '' : 'NOT ') + 'WORTH TO PRODUCE');
            console.log(Calc.profitPercentage(totalPrice, itemPrice) + ' % profit');

            this.plotlyLayout = diagram.layout;
            this.plotlyData = [diagram.data];
        }
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
