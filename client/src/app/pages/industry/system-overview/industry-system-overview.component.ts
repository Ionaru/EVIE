import { Component, OnDestroy, OnInit } from '@angular/core';
import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { objectsArrayToObject, sortArrayByObjectProperty } from '@ionaru/array-utils';
import { IUniverseSystemData } from '@ionaru/eve-utils';
import * as countdown from 'countdown';

import { Calc } from '../../../../shared/calc.helper';
import { BlueprintsService } from '../../../data-services/blueprints.service';
import { IndustryJobsService } from '../../../data-services/industry-jobs.service';
import { NamesService } from '../../../data-services/names.service';
import { StationsService } from '../../../data-services/stations.service';
import { StructuresService } from '../../../data-services/structures.service';
import { SystemsService } from '../../../data-services/systems.service';
import { CharacterService } from '../../../models/character/character.service';
import { ScopesComponent } from '../../scopes/scopes.component';
import { IBlueprints, IExtendedIndustryJobsData, IndustryComponent } from '../industry.component';

interface ISystemOverviewSystem {
    readyJobs: number;
    totalJobs: number;
    securityClass: string;
    securityStatus: number;
    name: string;
    id: number;
    locations: ISystemOverviewLocation[];
}

interface ISystemOverviewLocation {
    name: string;
    jobs: IExtendedIndustryJobsData[];
}

@Component({
    selector: 'app-industry-system-overview',
    styleUrls: ['./industry-system-overview.component.scss'],
    templateUrl: './industry-system-overview.component.html',
})
export class IndustrySystemOverviewComponent extends IndustryComponent implements OnInit, OnDestroy {

    public industryJobs: IExtendedIndustryJobsData[] = [];
    public blueprints: IBlueprints = {};

    public overview?: ISystemOverviewSystem[];

    public openAccordionIcon = faChevronDown;

    public runningJobsTimer?: number;

    constructor(
        private industryJobsService: IndustryJobsService,
        private blueprintsService: BlueprintsService,
        private namesService: NamesService,
        private stationsService: StationsService,
        private structuresService: StructuresService,
        private systemService: SystemsService,
    ) {
        super();
        countdown.setLabels(
            '|s|m|h|d',
            '|s|m|h|d',
            ', ');
        this.requiredScopes = [
            ScopesComponent.scopeCodes.STRUCTURES,
        ];
    }

    public resetTimers() {
        if (this.runningJobsTimer) {
            clearInterval(this.runningJobsTimer);
        }
    }

    public async ngOnInit() {
        super.ngOnInit();
        this.resetTimers();

        await Promise.all([
            this.getBlueprints(),
            this.getIndustryJobs(),
        ]);

        this.processIndustryJobs().then();
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        this.resetTimers();
    }

    public async getLocation(job: IExtendedIndustryJobsData) {

        if (job.output_location_id > Calc.maxIntegerValue) {
            if (CharacterService.selectedCharacter && IndustrySystemOverviewComponent.hasStructuresScope) {
                const structure = await this.structuresService.getStructureInfo(
                    CharacterService.selectedCharacter, job.output_location_id);
                if (structure) {
                    return {
                        stationName: structure.name,
                        system: structure.solar_system_id,
                    };
                }
            } else {
                job.locationName = 'An unknown Upwell structure';
            }
        } else {
            const station = await this.stationsService.getStationInfo(job.output_location_id);
            if (station) {
                return {
                    stationName: station.name,
                    system: station.system_id,
                };
            }
        }
        return;
    }

    public roundSecStatus = (secStatus: number) => Number(secStatus.toPrecision(1));

    public getSecurityClass(secStatus: number) {
        const roundedSecStatus = this.roundSecStatus(secStatus);
        switch (true) {
            case secStatus < 0.05:
                return '00';
            case roundedSecStatus === 0.1:
                return '01';
            case roundedSecStatus === 0.2:
                return '02';
            case roundedSecStatus === 0.3:
                return '03';
            case roundedSecStatus === 0.4:
                return '04';
            case roundedSecStatus === 0.5:
                return '05';
            case roundedSecStatus === 0.6:
                return '06';
            case roundedSecStatus === 0.7:
                return '07';
            case roundedSecStatus === 0.8:
                return '08';
            case roundedSecStatus === 0.9:
                return '09';
            case roundedSecStatus >= 1:
                return '10';
            default:
                return '10';
        }
    }

    public async getBlueprints() {
        if (CharacterService.selectedCharacter && IndustrySystemOverviewComponent.hasBlueprintScope) {
            const blueprintData = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter);
            this.blueprints = objectsArrayToObject(blueprintData, 'item_id');
        }
    }

    public async getIndustryJobs() {
        if (CharacterService.selectedCharacter && IndustrySystemOverviewComponent.hasIndustryJobsScope) {
            this.industryJobs = await this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter);
        }
    }

    public async getProductNames() {
        const productIds = this.industryJobs.map((job) => job.product_type_id);
        const productIdsNotUndefined = productIds.filter((id) => id !== undefined) as number[];
        await this.namesService.getNames(...productIdsNotUndefined);
    }

    public async processIndustryJobs() {

        const overviewData: ISystemOverviewSystem[] = [];

        if (this.industryJobs.length) {

            await this.getProductNames();
            this.startIndustryJobsTimers(this.industryJobs);

            for (const job of this.industryJobs) {

                const location = await this.getLocation(job);
                if (!location) {
                    continue;
                }

                const systemInfo = await this.systemService.getSystemInfo(location.system);
                if (!systemInfo) {
                    continue;
                }

                const systemOverview = this.processSystemInfo(overviewData, systemInfo);

                let locationInfo: ISystemOverviewLocation | undefined = systemOverview.locations.find(
                    (overviewLocation) => {
                        return overviewLocation.name === location.stationName;
                    });

                if (!locationInfo) {
                    locationInfo = {
                        jobs: [],
                        name: location.stationName,
                    };
                    systemOverview.locations.push(locationInfo);
                }

                this.setMiscJobData(job);
                this.setJobCounts(systemOverview, job);

                locationInfo.jobs.push(job);

                sortArrayByObjectProperty(systemOverview.locations, 'name');
                sortArrayByObjectProperty(locationInfo.jobs, 'job_id', true);
                sortArrayByObjectProperty(locationInfo.jobs, 'timeLeft');
            }

            sortArrayByObjectProperty(overviewData, 'name');

            this.overview = overviewData;
        }
    }

    public setJobCounts(systemOverview: ISystemOverviewSystem, job: IExtendedIndustryJobsData) {
        systemOverview.totalJobs++;
        if (job.timeLeft !== undefined && job.timeLeft <= 0) {
            systemOverview.readyJobs++;
        }
    }

    public setMiscJobData(job: IExtendedIndustryJobsData) {
        if (job.product_type_id) {
            job.productName = NamesService.getNameFromData(job.product_type_id);
        }

        job.activityIcon = this.getIconForIndustryActivity(job.activity_id);
    }

    public processSystemInfo(overviewData: ISystemOverviewSystem[], systemInfo: IUniverseSystemData): ISystemOverviewSystem {
        let systemOverview: ISystemOverviewSystem | undefined = overviewData.find((s) => {
            return s.id === systemInfo.system_id;
        });

        if (!systemOverview) {
            systemOverview = {
                id: systemInfo.system_id,
                locations: [],
                name: systemInfo.name as any,
                readyJobs: 0,
                securityClass: this.getSecurityClass(systemInfo.security_status),
                securityStatus: systemInfo.security_status,
                totalJobs: 0,
            };
            overviewData.push(systemOverview);
        }

        return systemOverview;
    }
}
