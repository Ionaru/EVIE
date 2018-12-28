import { Component, OnDestroy, OnInit } from '@angular/core';
import { faArrowRight, faCog, faCopy, faGem, faHourglass, faMicroscope, faRepeat } from '@fortawesome/pro-regular-svg-icons';
import { faCog as faCogSolid } from '@fortawesome/pro-solid-svg-icons';
import * as countdown from 'countdown';

import { Calc } from '../../../shared/calc.helper';
import { Common } from '../../../shared/common.helper';
import { ICharacterBlueprintsData, IIndustryJobsData, IndustryActivity } from '../../../shared/interface.helper';
import { BlueprintsService } from '../../data-services/blueprints.service';
import { IndustryJobsService } from '../../data-services/industry-jobs.service';
import { NamesService } from '../../data-services/names.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

interface IExtendedIndustryJobsData extends IIndustryJobsData {
    percentageDone?: number;
    timeLeft?: number | countdown.Timespan;
    productName?: string;
}

interface IBlueprints {
    [index: number]: ICharacterBlueprintsData;
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

    // tslint:disable-next-line:no-bitwise
    private readonly countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    constructor(private industryJobsService: IndustryJobsService, private blueprintsService: BlueprintsService,
                private namesService: NamesService) {
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
            this.blueprints = Common.objectsArrayToObject(blueprintData, 'item_id');
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

                job.timeLeft = countdown(now, end, this.countdownUnits);
            }

            this.setProductNames(this.industryJobs);

            Common.sortArrayByObjectProperty(this.industryJobs, 'job_id', false);
            Common.sortArrayByObjectProperty(this.industryJobs, 'percentageDone', true);
        }
    }

    public setProductNames(industryJobs: IExtendedIndustryJobsData[]) {
        const namesToGet = industryJobs.map((job) => {
            if (job.product_type_id && job.activity_id === IndustryActivity.manufacturing) {
                return job.product_type_id;
            }
            return 0;
        }).filter(Boolean);

        this.namesService.getNames(...namesToGet).then(() => {
            if (industryJobs) {
                for (const job of industryJobs) {
                    if (job.product_type_id && job.activity_id === IndustryActivity.manufacturing) {
                        job.productName = NamesService.getNameFromData(job.product_type_id);
                    }
                }
            }
        });
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
