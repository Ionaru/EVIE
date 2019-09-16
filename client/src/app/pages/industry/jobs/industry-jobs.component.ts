import { Component, OnDestroy, OnInit } from '@angular/core';
import { faLocation } from '@fortawesome/pro-regular-svg-icons';
import { faCheck, faCog as faCogSolid } from '@fortawesome/pro-solid-svg-icons';
import { objectsArrayToObject, sortArrayByObjectProperty } from '@ionaru/array-utils';
import { IndustryActivity } from '@ionaru/eve-utils';
import * as countdown from 'countdown';

import { Calc } from '../../../../shared/calc.helper';
import { BlueprintsService } from '../../../data-services/blueprints.service';
import { IndustryJobsService } from '../../../data-services/industry-jobs.service';
import { NamesService } from '../../../data-services/names.service';
import { StructuresService } from '../../../data-services/structures.service';
import { CharacterService } from '../../../models/character/character.service';
import { IBlueprints, IExtendedIndustryJobsData, IndustryComponent } from '../industry.component';

@Component({
    selector: 'app-industry-jobs',
    styleUrls: ['./industry-jobs.component.scss'],
    templateUrl: './industry-jobs.component.html',
})
export class IndustryJobsComponent extends IndustryComponent implements OnInit, OnDestroy {

    // Icons
    public jobInProgressIcon = faCogSolid;
    public jobFinishedIcon = faCheck;
    public locationIcon = faLocation;

    public runningJobsTimer?: number;

    public industryJobs?: IExtendedIndustryJobsData[];

    public blueprints: IBlueprints = {};

    constructor(private industryJobsService: IndustryJobsService, private blueprintsService: BlueprintsService,
                private namesService: NamesService, private structuresService: StructuresService) {
        super();
        countdown.setLabels(
            '|s|m|h|d',
            '|s|m|h|d',
            ', ');
    }

    public ngOnInit() {
        super.ngOnInit();
        this.resetTimers();
        this.getIndustryJobs().then();
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        this.resetTimers();
    }

    public resetTimers() {
        if (this.runningJobsTimer) {
            clearInterval(this.runningJobsTimer);
        }
    }

    public async getIndustryJobs() {
        if (CharacterService.selectedCharacter && IndustryJobsComponent.hasBlueprintScope) {
            const blueprintData = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter);
            this.blueprints = objectsArrayToObject(blueprintData, 'item_id');
        }

        if (CharacterService.selectedCharacter && IndustryJobsComponent.hasIndustryJobsScope) {
            this.industryJobs = await this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter);
        }

        if (this.industryJobs) {

            // Get ME / TE for BP

            this.startIndustryJobsTimers(this.industryJobs);

            sortArrayByObjectProperty(this.industryJobs, 'job_id', true);
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
                if (CharacterService.selectedCharacter && IndustryJobsComponent.hasStructuresScope) {
                    const structure = await this.structuresService.getStructureInfo(
                        CharacterService.selectedCharacter, job.output_location_id);
                    if (structure) {
                        job.locationName = structure.name;
                    }
                } else {
                    job.locationName = 'An unknown Upwell structure';
                }
            } else {
                await this.namesService.getNames(job.output_location_id);
                job.locationName = NamesService.getNameFromData(job.output_location_id);
            }
        }
    }
}
