import { Component } from '@angular/core';
import { ICharacterBlueprintsDataUnit, ICharacterIndustryJobsDataUnit } from '@ionaru/eve-utils';
import { environment } from '../../../environments/environment';

import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

export interface IExtendedIndustryJobsData extends ICharacterIndustryJobsDataUnit {
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

    protected debugMode = !environment.production;

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
}
