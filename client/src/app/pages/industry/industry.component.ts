import { Component, OnInit } from '@angular/core';

import { IndustryJobsService } from '../../data-services/industry-jobs.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';

@Component({
    selector: 'app-industry',
    styleUrls: ['./industry.component.scss'],
    templateUrl: './industry.component.html',
})
export class IndustryComponent extends DataPageComponent implements OnInit {

    constructor(private industryJobsService: IndustryJobsService) {
        super();
    }

    public ngOnInit() {
        super.ngOnInit();
        if (CharacterService.selectedCharacter) {
            this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter).then();
        }
    }
}
