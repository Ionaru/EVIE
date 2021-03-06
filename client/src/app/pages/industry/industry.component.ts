import { Component } from '@angular/core';
import {
    faArrowRight,
    faCog,
    faCopy,
    faDice,
    faGem,
    faHourglass,
    faMicroscope,
    faRepeat,
    faSpinnerThird,
    faTrash,
    faUser,
    faUserPlus,
    IconDefinition,
} from '@fortawesome/pro-regular-svg-icons';
import { ICharacterBlueprintsDataUnit, ICharacterIndustryJobsDataUnit, IndustryActivity } from '@ionaru/eve-utils';
import * as countdown from 'countdown';

import { environment } from '../../../environments/environment';
import { Calc } from '../../../shared/calc.helper';
import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { Scope } from '../scopes/scopes.component';

export interface IExtendedIndustryJobsData extends ICharacterIndustryJobsDataUnit {
    activityIcon?: IconDefinition;
    percentageDone?: number;
    timeCountdown?: number | countdown.Timespan;
    timeLeft?: number;
    productName?: string;
    locationName?: string;
    locationType?: string;
    locationSystem?: number;
    installerName?: string;
    inputImageType?: 'bp' | 'bpc';
    outputImageType?: 'bp' | 'bpc' | 'icon';
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
    public installerIcon = faUser;

    public addIcon = faUserPlus;
    public removeIcon = faTrash;
    public busyIcon = faSpinnerThird;

    public debugMode = !environment.production;

    public IndustryActivity = IndustryActivity;

    // tslint:disable-next-line:no-bitwise
    protected readonly countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    constructor() {
        super();
        this.requiredScopes = [
            Scope.JOBS,
            Scope.BLUEPRINTS,
        ];
    }

    protected static get hasIndustryJobsScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.JOBS);
    }

    protected static get hasStructuresScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.STRUCTURES);
    }

    protected static get hasBlueprintScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.BLUEPRINTS);
    }

    public getIndustryActivityName(activity: number) {
        switch (activity) {
            case IndustryActivity.RESEARCH_MATERIAL_EFFICIENCY:
                return 'Material efficiency research';
            case IndustryActivity.RESEARCH_TIME_EFFICIENCY:
                return 'Time efficiency research';
            case IndustryActivity.COPYING:
                return 'Copying';
            case IndustryActivity.INVENTION:
                return 'Invention';
            case IndustryActivity.MANUFACTURING:
            default:
                return 'Manufacturing';
        }
    }

    public getIconForIndustryActivity(activity: number) {
        switch (activity) {
            case IndustryActivity.RESEARCH_MATERIAL_EFFICIENCY:
                return this.materialResearchIcon;
            case IndustryActivity.RESEARCH_TIME_EFFICIENCY:
                return this.timeResearchIcon;
            case IndustryActivity.COPYING:
                return this.copyIcon;
            case IndustryActivity.INVENTION:
                return this.inventionIcon;
            case IndustryActivity.MANUFACTURING:
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

    public getInstallerName(installerId: number) {
        const installer = UserService.user.characters.find((character) => character.characterId === installerId);
        if (installer) {
            return installer.name;
        }
        return 'Unknown character';
    }

    public setImageTypes(blueprints: IBlueprints, job: IExtendedIndustryJobsData) {
        // tslint:disable-next-line:no-non-null-assertion
        job.inputImageType = blueprints[job.blueprint_id] && blueprints[job.blueprint_id]!.runs !== -1 ? 'bpc' : 'bp';

        if ([IndustryActivity.COPYING, IndustryActivity.INVENTION].includes(job.activity_id)) {
            job.outputImageType = 'bpc';
        } else if ([IndustryActivity.RESEARCH_MATERIAL_EFFICIENCY, IndustryActivity.RESEARCH_TIME_EFFICIENCY].includes(job.activity_id)) {
            job.outputImageType = 'bp';
        } else {
            job.outputImageType = 'icon';
        }
    }
}
