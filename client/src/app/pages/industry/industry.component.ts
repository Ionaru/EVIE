import { Component, OnInit } from '@angular/core';

import { IndustryJobsService } from '../../data-services/industry-jobs.service';
import { IndustryService } from '../../data-services/industry.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';
import { CharacterService } from '../../models/character/character.service';

@Component({
    selector: 'app-industry',
    styleUrls: ['./industry.component.scss'],
    templateUrl: './industry.component.html',
})
export class IndustryComponent extends DataPageComponent implements OnInit {

    public industryJobs: any;

    constructor(private industryJobsService: IndustryJobsService, private typesService: TypesService,
                private industryService: IndustryService, private namesService: NamesService) {
        super();
        this.requiredScopes = [ScopesComponent.scopeCodes.JOBS];
    }

    public ngOnInit() {
        super.ngOnInit();
        this.getIndustryJobs().then();
    }

    public static get hasIndustryJobsScopes() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(ScopesComponent.scopeCodes.JOBS);
    }

    public async getIndustryJobs() {
        if (CharacterService.selectedCharacter && IndustryComponent.hasIndustryJobsScopes) {
            const jobs = await this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter);
            console.log(jobs);
            this.industryJobs = jobs;
        }
    }
}
