import { Component, OnDestroy, OnInit } from '@angular/core';
import { faArrowRight, faCog, faCopy, faGem, faHourglass, faMicroscope, faRepeat } from '@fortawesome/pro-regular-svg-icons';
import { faCheck, faCog as faCogSolid } from '@fortawesome/pro-solid-svg-icons';
import { objectsArrayToObject, sortArrayByObjectProperty } from '@ionaru/array-utils';
import { ICharacterBlueprintsDataUnit, ICharacterIndustryJobsDataUnit, IndustryActivity } from '@ionaru/eve-utils';
import * as countdown from 'countdown';

import { environment } from '../../../environments/environment';
import { Calc } from '../../../shared/calc.helper';
import { BlueprintsService } from '../../data-services/blueprints.service';
import { IndustryJobsService } from '../../data-services/industry-jobs.service';
import { NamesService } from '../../data-services/names.service';
import { StructuresService } from '../../data-services/structures.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

interface IExtendedIndustryJobsData extends ICharacterIndustryJobsDataUnit {
    percentageDone?: number;
    timeCountdown?: number | countdown.Timespan;
    timeLeft?: number;
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

    // tslint:disable-next-line:no-bitwise
    private readonly countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    constructor(private industryJobsService: IndustryJobsService, private blueprintsService: BlueprintsService,
                private namesService: NamesService, private structuresService: StructuresService) {
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
        this.getBlueprints().then();
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        this.resetTimers();
    }

    public static get hasIndustryJobsScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.JOBS);
    }

    public static get hasStructuresScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.STRUCTURES);
    }

    public static get hasBlueprintScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.BLUEPRINTS);
    }

    public resetTimers() {
        if (this.runningJobsTimer) {
            clearInterval(this.runningJobsTimer);
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
                const duration = Calc.secondsToMilliseconds(job.duration);
                const end = start + duration;
                const now = Date.now();

                const timeElapsed = now - start;
                job.percentageDone = Math.min(Calc.partPercentage((timeElapsed), duration), 100);

                job.timeLeft = end - now;
                job.timeCountdown = countdown(undefined, end, this.countdownUnits);
            }

            sortArrayByObjectProperty(this.industryJobs, 'job_id');
            sortArrayByObjectProperty(this.industryJobs, 'timeLeft');

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
                if (CharacterService.selectedCharacter && IndustryComponent.hasStructuresScope) {
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
}
