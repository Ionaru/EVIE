import { Component, OnInit } from '@angular/core';
import { faCopy, faHourglass, faMicroscope } from '@fortawesome/pro-regular-svg-icons';
import { faGem, faIndustry } from '@fortawesome/pro-solid-svg-icons';
import { Calc } from '../../../shared/calc.helper';
import { Common } from '../../../shared/common.helper';

import { IIndustryJobsData, IndustryActivity } from '../../../shared/interface.helper';
import { IndustryJobsService } from '../../data-services/industry-jobs.service';
import { IndustryService } from '../../data-services/industry.service';
import { NamesService } from '../../data-services/names.service';
import { TypesService } from '../../data-services/types.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

interface IExtendedIndustryJobsData extends IIndustryJobsData {
    percentageDone?: number;
    productName?: string;
}

@Component({
    selector: 'app-industry',
    styleUrls: ['./industry.component.scss'],
    templateUrl: './industry.component.html',
})
export class IndustryComponent extends DataPageComponent implements OnInit {

    // Icons
    public manufacturingIcon = faIndustry;
    public copyIcon = faCopy;
    public materialResearchIcon = faGem;
    public timeResearchIcon = faHourglass;
    public inventionIcon = faMicroscope;

    public industryJobs?: IExtendedIndustryJobsData[];
    public IndustryActivity = IndustryActivity;

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
            this.industryJobs = await this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter);
        }

        if (this.industryJobs) {

            // Get ME / TE for BP

            for (const job of this.industryJobs) {
                const start = new Date(job.start_date).getTime();
                const now = Date.now();

                const timeElapsed = now - start;
                job.percentageDone = Math.min(Calc.partPercentage((timeElapsed / 1000), job.duration), 100);
            }

            this.setProductNames(this.industryJobs);

            Common.sortArrayByObjectProperty(this.industryJobs, 'job_id', false);
            Common.sortArrayByObjectProperty(this.industryJobs, 'percentageDone', true);
        }
    }

    public setProductNames(industryJobs: IExtendedIndustryJobsData[]) {
        const namesToGet = industryJobs.map((job) => {
            if (job.activity_id === IndustryActivity.manufacturing) {
                return job.product_type_id;
            }
            return 0;
        }).filter(Boolean);

        this.namesService.getNames(...namesToGet).then(() => {
            if (industryJobs) {
                for (const job of industryJobs) {
                    if (job.activity_id === IndustryActivity.manufacturing) {
                        job.productName = NamesService.getNameFromData(job.product_type_id);
                    }
                }
            }
        });
    }
}
