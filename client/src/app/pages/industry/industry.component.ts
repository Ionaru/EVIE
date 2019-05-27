import { Component, OnDestroy, OnInit } from '@angular/core';
import { faArrowRight, faCog, faCopy, faGem, faHourglass, faMicroscope, faRepeat } from '@fortawesome/pro-regular-svg-icons';
import { faCheck, faCog as faCogSolid } from '@fortawesome/pro-solid-svg-icons';
import { objectsArrayToObject, sortArrayByObjectProperty, uniquifyArray } from '@ionaru/array-utils';
import {
    ICharacterBlueprintsData,
    ICharacterBlueprintsDataUnit,
    ICharacterIndustryJobsDataUnit,
    IndustryActivity,
} from '@ionaru/eve-utils';
import * as countdown from 'countdown';

import { environment } from '../../../environments/environment';
import { Calc } from '../../../shared/calc.helper';
import { ITableHeader } from '../../components/sor-table/sor-table.component';
import { BlueprintsService } from '../../data-services/blueprints.service';
import { IndustryJobsService } from '../../data-services/industry-jobs.service';
import { IndustryService } from '../../data-services/industry.service';
import { MarketService } from '../../data-services/market.service';
import { NamesService } from '../../data-services/names.service';
import { StructuresService } from '../../data-services/structures.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

interface IExtendedIndustryJobsData extends ICharacterIndustryJobsDataUnit {
    percentageDone?: number;
    timeLeft?: number | countdown.Timespan;
    productName?: string;
    locationName?: string;
}

interface IBlueprints {
    [index: number]: ICharacterBlueprintsDataUnit;
}

@Component({
    selector: 'app-industry',
    styleUrls: ['./industry.component.scss'],
    templateUrl: './industry.component.html',
})
export class IndustryComponent extends DataPageComponent implements OnInit, OnDestroy {

    // Icons
    public manufacturingIcon = faCog;
    public jobInProgressIcon = faCogSolid;
    public jobFinishedIcon = faCheck;
    public copyIcon = faCopy;
    public materialResearchIcon = faGem;
    public timeResearchIcon = faHourglass;
    public inventionIcon = faMicroscope;
    public arrowRight = faArrowRight;
    public jobRunsIcon = faRepeat;

    public runningJobsTimer?: number;

    public industryJobs?: IExtendedIndustryJobsData[];

    public blueprints: IBlueprints = {};

    public IndustryActivity = IndustryActivity;

    public debugMode = !environment.production;

    public blueprintTableData: any[] = [];

    public blueprintTableSettings: Array<ITableHeader<any>> = [{
        attribute: 'name',
        prefixFunction: (data) => `<img src="https://imageserver.eveonline.com/Type/${data.id}_32.png" alt="${data.name}"> `,
    }, {
        attribute: 'cost',
        pipe: 'number',
        pipeVar: '0.2-2',
        suffix: ' ISK',
    }, {
        attribute: 'value',
        pipe: 'number',
        pipeVar: '0.2-2',
        suffix: ' ISK',
    }, {
        attribute: 'profit',
        pipe: 'number',
        pipeVar: '0.2-2',
        suffix: ' %',
    }];

    // tslint:disable-next-line:no-bitwise
    private readonly countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    constructor(private industryJobsService: IndustryJobsService, private blueprintsService: BlueprintsService,
                private industryService: IndustryService, private namesService: NamesService, private structuresService: StructuresService,
                private marketService: MarketService) {
        super();
        countdown.setLabels(
            '|s|m|h|d',
            '|s|m|h|d',
            ', ');
        this.requiredScopes = [ScopesComponent.scopeCodes.JOBS];
    }

    public ngOnInit() {
        super.ngOnInit();
        this.getIndustryJobs().then();
        this.getBlueprints().then(() => this.doCalculations().then());
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        this.resetTimers();
    }

    public static get hasIndustryJobsScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.JOBS);
    }

    public static get hasBlueprintScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.BLUEPRINTS);
    }

    public resetTimers() {
        if (this.runningJobsTimer) {
            clearInterval(this.runningJobsTimer);
        }
    }

    public async doCalculations() {
        const blueprints = Object.values(this.blueprints) as ICharacterBlueprintsData;
        const blueprintTypeIds = blueprints.map((blueprint) => blueprint.type_id);
        const uniqueBlueprintTypeIds = uniquifyArray(blueprintTypeIds);

        this.blueprintTableData = [];

        for (const typeId of uniqueBlueprintTypeIds) {

            const product = await this.industryService.getBlueprintProduct(typeId);
            if (!product) {
                continue;
            }

            const manufacturingData = await this.industryService.getManufacturingData(product);
            if (!manufacturingData) {
                continue;
            }

            const blueprintME = blueprints.filter((blueprint) => blueprint.type_id === typeId)[0].material_efficiency;
            const materials = manufacturingData.materials.map((material) => {
                return {
                    id: material.id,
                    quantity: material.quantity - Math.floor(material.quantity * (blueprintME / 100)),
                };
            });

            let price = 0;
            for (const material of materials) {
                price += await this.getPriceForAmount(material.id, material.quantity);
            }

            await this.namesService.getNames(product);

            const orders = await this.marketService.getMarketOrders(10000002, product, 'buy');
            if (!orders || !orders.length) {
                continue;
            }

            sortArrayByObjectProperty(orders, 'price', true);

            const sellPrice = orders[0].price;

            console.log(NamesService.getNameFromData(product), price, sellPrice);
            // break;

            this.blueprintTableData.push({
                cost: price,
                id: typeId,
                name: NamesService.getNameFromData(product),
                profit: Calc.profitPercentage(price, sellPrice),
                value: sellPrice,
            });
        }
    }

    public async getBlueprints() {
        if (CharacterService.selectedCharacter && IndustryComponent.hasBlueprintScope) {
            const blueprintData = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter);
            this.blueprints = objectsArrayToObject(blueprintData, 'item_id');
        }
    }

    public async getIndustryJobs() {
        if (CharacterService.selectedCharacter && IndustryComponent.hasIndustryJobsScope) {
            this.industryJobs = await this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter);
        }

        if (this.industryJobs) {

            // Get ME / TE for BP

            for (const job of this.industryJobs) {
                const start = new Date(job.start_date).getTime();
                const duration = job.duration * 1000;
                const end = start + duration;
                const now = Date.now();

                const timeElapsed = now - start;
                job.percentageDone = Math.min(Calc.partPercentage((timeElapsed), duration), 100);

                job.timeLeft = countdown(undefined, end, this.countdownUnits);
            }

            sortArrayByObjectProperty(this.industryJobs, 'job_id', false);
            sortArrayByObjectProperty(this.industryJobs, 'percentageDone', true);

            this.setProductNames(this.industryJobs).then();
            this.getLocationNames(this.industryJobs).then();
        }
    }

    public async setProductNames(industryJobs: IExtendedIndustryJobsData[]) {
        const namesToGet = industryJobs.map((job) => {
            if (job.product_type_id && job.activity_id === IndustryActivity.manufacturing) {
                return job.product_type_id;
            }
            return 0;
        }).filter(Boolean);

        await this.namesService.getNames(...namesToGet);
        for (const job of industryJobs) {
            if (job.product_type_id && job.activity_id === IndustryActivity.manufacturing) {
                job.productName = NamesService.getNameFromData(job.product_type_id);
            }
        }
    }

    public async getLocationNames(industryJobs: IExtendedIndustryJobsData[]) {

        for (const job of industryJobs) {
            if (job.output_location_id > Calc.maxIntegerValue) {
                if (CharacterService.selectedCharacter && IndustryComponent.hasIndustryJobsScope) {
                    const structure = await this.structuresService.getStructureInfo(
                        CharacterService.selectedCharacter, job.output_location_id);
                    if (structure) {
                        job.locationName = structure.name;
                    }
                }
            } else {
                await this.namesService.getNames(job.output_location_id);
                job.locationName = NamesService.getNameFromData(job.output_location_id);
            }
        }
    }

    public getIndustryActivityName(activity: number) {
        switch (activity) {
            case IndustryActivity.research_material_efficiency:
                return 'Material efficiency research';
            case IndustryActivity.research_time_efficiency:
                return 'Time efficiency research';
            case IndustryActivity.copying:
                return 'Copying';
            case IndustryActivity.invention:
                return 'Invention';
            case IndustryActivity.manufacturing:
            default:
                return 'Manufacturing';
        }
    }

    public getIconForIndustryActivity(activity: number) {
        switch (activity) {
            case IndustryActivity.research_material_efficiency:
                return this.materialResearchIcon;
            case IndustryActivity.research_time_efficiency:
                return this.timeResearchIcon;
            case IndustryActivity.copying:
                return this.copyIcon;
            case IndustryActivity.invention:
                return this.inventionIcon;
            case IndustryActivity.manufacturing:
            default:
                return this.manufacturingIcon;
        }
    }

    private async getPriceForAmount(item: number, amount: number): Promise<number> {
        const orders = await this.marketService.getMarketOrders(10000016, item, 'sell');

        if (!orders || !orders.length) {
            return Infinity;
        }

        sortArrayByObjectProperty(orders, 'price');

        // const type = await this.typesService.getTypes(item);

        // if (!type) {
        //     return -1;
        // }

        // const gasVolume = type[0].volume;
        // const cargoCapacity = volume;

        let price = 0;
        let unitsLeft = amount;
        for (const order of orders) {
            const amountFromThisOrder = Math.min(order.volume_remain, unitsLeft);

            price += amountFromThisOrder * order.price;
            unitsLeft -= amountFromThisOrder;

            if (!unitsLeft) {
                break;
            }
        }

        if (unitsLeft) {
            // this.gasPrices[buySell][gas] = price / unitsLeft;
            return Infinity;
        }

        return price;
    }
}
