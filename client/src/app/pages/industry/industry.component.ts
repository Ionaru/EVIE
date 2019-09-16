import { Component } from '@angular/core';
import {
    faArrowRight,
    faCog,
    faCopy, faDice,
    faGem,
    faHourglass,
    faMicroscope,
    faRepeat,
    IconDefinition,
} from '@fortawesome/pro-regular-svg-icons';
import { ICharacterBlueprintsDataUnit, ICharacterIndustryJobsDataUnit, IndustryActivity } from '@ionaru/eve-utils';
import * as countdown from 'countdown';
import { environment } from '../../../environments/environment';
import { Calc } from '../../../shared/calc.helper';

import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

export interface IExtendedIndustryJobsData extends ICharacterIndustryJobsDataUnit {
    activityIcon?: IconDefinition;
    percentageDone?: number;
    timeCountdown?: number | countdown.Timespan;
    timeLeft?: number;
    productName?: string;
    locationName?: string;
    locationSystem?: number;
}

export interface IBlueprints {
    [index: number]: ICharacterBlueprintsDataUnit | undefined;
}

@Component({
    selector: 'app-industry',
    styleUrls: ['./industry.component.scss'],
    templateUrl: './industry.component.html',
})
export class IndustryComponent extends DataPageComponent {

    public manufacturingIcon = faCog;
    public copyIcon = faCopy;
    public materialResearchIcon = faGem;
    public timeResearchIcon = faHourglass;
    public inventionIcon = faMicroscope;
    public arrowRight = faArrowRight;
    public jobRunsIcon = faRepeat;
    public inventionChanceIcon = faDice;

    public debugMode = !environment.production;

    public IndustryActivity = IndustryActivity;

    // tslint:disable-next-line:no-bitwise
    protected readonly countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    constructor() {
        super();
        this.requiredScopes = [
            ScopesComponent.scopeCodes.JOBS,
            ScopesComponent.scopeCodes.BLUEPRINTS,
        ];
    }

    protected static get hasIndustryJobsScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.JOBS);
    }

    protected static get hasStructuresScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.STRUCTURES);
    }

    protected static get hasBlueprintScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.BLUEPRINTS);
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

    public startIndustryJobsTimers(industryJobs: IExtendedIndustryJobsData[]) {
        this.processIndustryJobsTimers(industryJobs);

        setInterval(() => {
            this.processIndustryJobsTimers(industryJobs);
        }, Calc.second);
    }

    public processIndustryJobsTimers(industryJobs: IExtendedIndustryJobsData[]) {
        const now = Date.now();
        for (const job of industryJobs) {
            const start = new Date(job.start_date).getTime();
            const end = new Date(job.end_date).getTime();
            const duration = Calc.secondsToMilliseconds(job.duration);
            const timeElapsed = now - start;

            job.percentageDone = Math.min(Math.floor(Calc.partPercentage((timeElapsed), duration)), 100);

            job.timeLeft = end - now;
            job.timeCountdown = countdown(undefined, end, this.countdownUnits);
        }
    }
}
