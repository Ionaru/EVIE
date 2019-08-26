// TODO: Remove line below.
// tslint:disable

import { Component, OnInit } from '@angular/core';
// import { BlueprintsService } from '../../data-services/blueprints.service';
// import { faGem } from '@fortawesome/pro-regular-svg-icons';
// import { faHourglass } from '@fortawesome/pro-solid-svg-icons';

// import { IManufacturingData } from '../../../shared/interface.helper';
// import { IndustryJobsService } from '../../data-services/industry-jobs.service';
import { IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
// import { CharacterService } from '../../models/character/character.service';
// import { TypesService } from '../../data-services/types.service';
// import { DataPageComponent } from '../data-page/data-page.component';

// interface IManufacturingCache {
//     [index: string]: IManufacturingData;
// }

@Component({
    selector: 'app-blueprint-calculator',
    styleUrls: ['./blueprint-calculator.component.scss'],
    templateUrl: './blueprint-calculator.component.html',
})
export class BlueprintCalculatorComponent implements OnInit {

    // public faHourglass = faHourglass;
    // public faGem = faGem;

    // public bpMats: number[] = [];

    public baseMats: string[] = [];
    public bups: yyy = {};

    // public prices: IItemPrices;

    // public manufactuingCache: IManufacturingCache = {};

    constructor(
        // private blueprintsService: BlueprintsService,
        private industryService: IndustryService,
        private marketService: MarketService,
        private namesService: NamesService
    ) { }

    public ngOnInit() {
        this.bups = {};
        this.baseMats = [];
        // this.fun().then();
        this.recFun().then();
        this.recFun2().then();

        // if (CharacterService.selectedCharacter) {
        //     this.blueprintsService.getBlueprints(CharacterService.selectedCharacter).then((res) => {
        //         console.log(res);
        //     })
        // }

        // const jsp = jsPlumb.getInstance();
        // console.log(jsp.addEndpoint());

        // this.getMats().then((mats) => {
        //     console.log(mats);
        // });
        // if (CharacterService.selectedCharacter) {
        //     this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter).then();
        // }
        //
        // this.typesService.getTypes(34, 35).then();
    }

    // public async fun() {
    //     const i = await this.industryService.getManufacturingData(40340);
    //     if (i) {
    //         this.bps.push(i.blueprintId);
    //
    //         for (const material of i.materials) {
    //             const j = await this.industryService.getManufacturingData(material.id);
    //
    //             if (j) {
    //                 this.bps.push(j.blueprintId);
    //
    //                 for (const submat of j.materials) {
    //                     const k = await this.industryService.getManufacturingData(submat.id);
    //
    //                     if (k) {
    //                         this.bps.push(k.blueprintId);
    //                     } else {
    //                         this.bps.push(submat.id);
    //                     }
    //                 }
    //             } else {
    //                 this.bps.push(material.id);
    //             }
    //         }
    //     }
    //
    //     // await this.namesService.getNames(...this.bps);
    //     //
    //     // for (const x of this.bps) {
    //     //     console.log(NamesService.getNameFromData(x));
    //     // }
    // }

    public async getMats(m = 12003) {

        const mats: any[] = [];

        const i = await this.industryService.getManufacturingData(m);
        if (i) {
            for (const ma of i.materials) {
                mats.push(await this.getMats(ma.id));
            }
        }

        return mats;
    }

    // KEEPSTAR 40340
    // ZEALOT 12003

    public bupKeys = () => Object.keys(this.bups);

    public async recFun2(m = 11184) {
        const i = await this.industryService.getManufacturingData(m);
        if (!i) {
            return;
        }

        const componentPrices: xxx = {};

        console.log(i);
        await this.namesService.getNames(...i.materials.map((mat) => mat.id));

        for (const mat of i.materials) {
            const price = await this.marketService.getPriceForAmount(10000002, mat.id, mat.quantity, 'sell');

            if (!price) {
                throw new Error(`Price not found for ${mat.id}`);
            }

            console.log('COMPONENT PRICE', price);

            const subMatData = await this.industryService.getManufacturingData(mat.id);

            let materialPrices = 0;

            if (!subMatData) {
                componentPrices[mat.id] = price;
            } else {

                for (const subMat of subMatData.materials) {
                    const subPrice = await this.marketService.getPriceForAmount(10000002, subMat.id, subMat.quantity, 'sell');

                    if (subPrice) {
                        materialPrices += subPrice;
                    } else {
                        materialPrices = Infinity;
                        break;
                    }
                }

                console.log('MATERIAL PRICE', materialPrices);
            }

            if (materialPrices && materialPrices < price) {
                console.log(`MAKE ${NamesService.getNameFromData(mat.id)} WITH MATERIALS`);
            } else {
                console.log(`BUY ${NamesService.getNameFromData(mat.id)} OFF MARKET`);
            }
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

        // console.log(this.bups);

        this.baseMats.push(...Object.keys(matob));
        this.baseMats.push(...bp);

        await this.namesService.getNames(...Object.keys(matob));

        const matob2: xxx = {};
        for (const id of Object.keys(matob)) {
            matob2[NamesService.getNameFromData(Number(id))] = matob[id];
        }

        // console.log(matob2);

        //
        // for (const mat of materials.slice()) {
        //     const j = await this.industryService.getManufacturingData(mat.id);
        //     if (j) {
        //         basemats.push(materials.splice(materials.indexOf(mat), 1)[0]);
        //         // console.log(materials);
        //     }
        // }
        //
        //
        // for (const x of basemats) {
        //     console.log(NamesService.getNameFromData(x.id));
        // }
    }
}

// interface IItemPrices {
//     [index: string]: number;
// }

interface xxx {
    [index: string]: number;
}

interface yyy {
    [index: string]: number[];
}
