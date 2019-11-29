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
        // const item = 40340; // Keepstar
        // const item = 12003; // Zealot
        // const item = 11365; // Vengeance
        // const item = 11184; // Crusader

        // this.recFun(item).then();
        // this.recFun2(item).then();

        this.plotlyData = [{
            type: "sankey",
            orientation: "h",
            node: {
                pad: 15,
                thickness: 30,
                line: {
                    color: "#EFF0F1",
                    width: 0.5
                },
                label: ["A1", "A2", "B1", "B2", "Final Product"],
                color: ["#171B23", "#171B23", "#171B23", "#171B23", "#171B23", "#171B23"]
            },

            link: {
                source: [0, 1, 0, 2, 3],
                target: [2, 3, 3, 4, 4],
                value: [8, 4, 2, 8, 6],
                // color: ['#ff0000', '#00ff00', '#ff00ff', 'inherit', '#ff0000', '#0000ff']
            }
        }];

        const diagram = new SankeyDiagram({
            // title: "Basic Sankey",
            font: {
                size: 10,
                color: 'white'
            },
            plot_bgcolor: '#101010',
            paper_bgcolor: '#101010',
        });

        this.plotlyLayout = diagram.layout;
    }

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
        return manufacturingData.materials;
    }

    public async recFun2(m = 11184) {
    // public async recFun2(m = 12003) {

        // const marketRegion = 10000002; // The Forge
        const marketRegion = 10000043; // Domain

        // public async recFun2(m = 25898) {
        const manufacturingData = await this.industryService.getManufacturingData(m);
        if (!manufacturingData) {
            return;
        }

        const materials = await this.adjustMaterialsNeededByBlueprintMaterialEfficiency(manufacturingData);

        let totalPrice = 0;

        for (const material of materials) {
            const price = await this.marketService.getPriceForAmount(marketRegion, material.id, material.quantity, 'buy');

            if (!price) {
                throw new Error(`Price not found for ${material.id}`);
            }

            const subMatData = await this.industryService.getManufacturingData(material.id);

            let materialPrices = 0;

            if (!subMatData) {
                // Can't be produced.
                totalPrice += price;
                this.shoppingList.add(material.id, material.quantity);
            } else {

                const subMaterials = await this.adjustMaterialsNeededByBlueprintMaterialEfficiency(subMatData);

                const subMatShoppingList = new ShoppingList();

                for (const subMat of subMaterials) {
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
                    this.shoppingList.merge(subMatShoppingList, material.quantity);

                } else {
                    // Cheaper to buy
                    totalPrice += price;
                    this.shoppingList.add(material.id, material.quantity);
                }
            }
        }

        const itemPrice = await this.marketService.getPriceForAmount(marketRegion, m, 1, 'sell');

        if (itemPrice) {

            const types = Object.keys(this.shoppingList.list).map((key) => Number(key));

            const typeInfo = (await Promise.all([
                this.typesService.getTypes(...types),
                this.namesService.getNames(...types),
            ]))[0];

            if (typeInfo) {
                this.shoppingList.volume = typeInfo.reduce((accumulator, type) => accumulator + (type.volume! * this.shoppingList.list[type.type_id]), 0)
            }

            console.log(totalPrice, itemPrice);
            console.log((totalPrice < itemPrice ? '' : 'NOT ') + 'WORTH TO PRODUCE');
            console.log(Calc.profitPercentage(totalPrice, itemPrice) + ' % profit');
        }
    }

    // public async recFun(m = 12003) {
        public async recFun(m = 11184) {
        // public async recFun(m = 25898) {
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
