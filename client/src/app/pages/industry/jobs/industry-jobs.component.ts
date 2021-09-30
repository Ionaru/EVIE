import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
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
import { createTitle } from '../../../shared/title';

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

    constructor(
        private industryJobsService: IndustryJobsService,
        private blueprintsService: BlueprintsService,
        private namesService: NamesService,
        private structuresService: StructuresService,
        private title: Title,
    ) {
        super();
        this.title.setTitle(createTitle('Industry: Jobs'));
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
        let industryJobs: IExtendedIndustryJobsData[] = [];

        if (CharacterService.selectedCharacter && IndustryJobsComponent.hasBlueprintScope) {
            const blueprintData = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter);
            this.blueprints = objectsArrayToObject(blueprintData, (blueprint) => blueprint.item_id);
        }

        if (CharacterService.selectedCharacter && IndustryJobsComponent.hasIndustryJobsScope) {
            industryJobs = await this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter);
        }

        if (industryJobs) {

            // Get ME / TE for BP

            this.startIndustryJobsTimers(industryJobs);

            sortArrayByObjectProperty(industryJobs, (job) => job.job_id, true);
            sortArrayByObjectProperty(industryJobs, (job) => job.timeLeft || 0);

            this.setProductNames(industryJobs).then();
            this.getLocationNames(industryJobs).then();
            industryJobs.forEach((job) => this.setImageTypes(this.blueprints, job));
        }

        this.industryJobs = industryJobs;
    }

    public async setProductNames(industryJobs: IExtendedIndustryJobsData[]) {
        const namesToGet = industryJobs.map((job) => {
            if (job.product_type_id && job.activity_id === IndustryActivity.MANUFACTURING) {
                return job.product_type_id;
            }
            return 0;
        }).filter(Boolean);

        await this.namesService.getNames(...namesToGet);
        for (const job of industryJobs) {
            if (job.product_type_id && job.activity_id === IndustryActivity.MANUFACTURING) {
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
                    if (structure && structure.type_id) {
                        job.locationName = structure.name;
                        await this.namesService.getNames(structure.type_id);
                        job.locationType = NamesService.getNameFromData(structure.type_id);
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
