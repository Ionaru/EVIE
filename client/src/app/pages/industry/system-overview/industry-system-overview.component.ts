import { Component, OnDestroy, OnInit } from '@angular/core';
import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { objectsArrayToObject, uniquifyArray } from '@ionaru/array-utils';
import { IUniverseSystemData } from '@ionaru/eve-utils';
import * as countdown from 'countdown';

import { Calc } from '../../../../shared/calc.helper';
import { BlueprintsService } from '../../../data-services/blueprints.service';
import { IndustryJobsService } from '../../../data-services/industry-jobs.service';
import { StationsService } from '../../../data-services/stations.service';
import { StructuresService } from '../../../data-services/structures.service';
import { SystemsService } from '../../../data-services/systems.service';
import { CharacterService } from '../../../models/character/character.service';
import { IBlueprints, IExtendedIndustryJobsData, IndustryComponent } from '../industry.component';

interface IJobsBySystem {
    [key: string]: IJobsByLocation;
}

interface IJobsByLocation {
    [key: string]: IExtendedIndustryJobsData[];
}

@Component({
    selector: 'app-industry-system-overview',
    styleUrls: ['./industry-system-overview.component.scss'],
    templateUrl: './industry-system-overview.component.html',
})
export class IndustrySystemOverviewComponent extends IndustryComponent implements OnInit, OnDestroy {

    public industryJobs?: IExtendedIndustryJobsData[];
    public blueprints: IBlueprints = {};
    public systems: IUniverseSystemData[] = [];

    public jobsByLocation?: IJobsBySystem;

    public openAccordionIcon = faChevronDown;

    constructor(
        private industryJobsService: IndustryJobsService,
        private blueprintsService: BlueprintsService,
        // private namesService: NamesService,
        private stationsService: StationsService,
        private structuresService: StructuresService,
        private systemService: SystemsService,
    ) {
        super();
        countdown.setLabels(
            '|s|m|h|d',
            '|s|m|h|d',
            ', ');
    }

    public ngOnInit() {
        super.ngOnInit();
        // this.resetTimers();
        this.getIndustryJobs().then();
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        // this.resetTimers();
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

    public get jobsByLocationKeys() {
        return this.jobsByLocation ? Object.keys(this.jobsByLocation) : [];
    }

    public systemInfo = (systemId: string) => this.systems.find((system) => system.system_id === Number(systemId));

    public getLocationsForSystem = (systemId: string) => this.jobsByLocation ? Object.keys(this.jobsByLocation[systemId]) : [];

    public getJobsForLocation = (systemId: string, location: string) => this.jobsByLocation ? this.jobsByLocation[systemId][location] : [];

    public getJobCountForLocation(systemId: string) {
        if (!this.jobsByLocation) {
            return 0;
        }

        const locationsInSystem = Object.values(this.jobsByLocation[systemId]);
        return locationsInSystem.reduce((location) => Object.values(location)).length;
    }

    public async getIndustryJobs() {
        if (CharacterService.selectedCharacter && IndustrySystemOverviewComponent.hasBlueprintScope) {
            const blueprintData = await this.blueprintsService.getBlueprints(CharacterService.selectedCharacter);
            this.blueprints = objectsArrayToObject(blueprintData, 'item_id');
        }

        if (CharacterService.selectedCharacter && IndustrySystemOverviewComponent.hasIndustryJobsScope) {
            this.industryJobs = await this.industryJobsService.getIndustryJobs(CharacterService.selectedCharacter);
        }

        if (this.industryJobs) {

            const systems: number[] = [];

            const jobsOverview: IJobsBySystem = {};

            for (const job of this.industryJobs) {
                const location = await this.getLocation(job);

                if (!location) {
                    continue;
                }

                if (!jobsOverview[location.system]) {
                    jobsOverview[location.system] = {};
                }

                if (!jobsOverview[location.system][job.output_location_id]) {
                    jobsOverview[location.system][job.output_location_id] = [];
                }

                jobsOverview[location.system][job.output_location_id].push(job);

                systems.push(location.system);
            }

            this.jobsByLocation = jobsOverview;

            this.getJobCountForLocation('30003915');

            Promise.all([uniquifyArray(systems).map(async (system) => {
                const systemInfo = await this.systemService.getSystemInfo(system);
                if (systemInfo) {
                    this.systems.push(systemInfo);
                }
            })]).then();

            // const locations = this.industryJobs.map((job) => job.output_location_id);

            // Get ME / TE for BP

            // this.processIndustryJobs().then();

            // this.runningJobsTimer = setInterval(() => {
            //     this.processIndustryJobs();
            // }, Calc.second);

            // sortArrayByObjectProperty(this.industryJobs, 'job_id', true);
            // sortArrayByObjectProperty(this.industryJobs, 'timeLeft');

            // this.setProductNames(this.industryJobs).then();
            // this.getLocationNames(this.industryJobs).then();
        }
    }

    // public async processIndustryJobs() {
    //     if (this.industryJobs) {
    //         for (const job of this.industryJobs) {
    //             const start = new Date(job.start_date).getTime();
    //             const duration = Calc.secondsToMilliseconds(job.duration);
    //             const end = start + duration;
    //             const now = Date.now();
    //
    //             const timeElapsed = now - start;
    //             job.percentageDone = Math.min(Math.floor(Calc.partPercentage((timeElapsed), duration)), 100);
    //
    //             job.timeLeft = end - now;
    //             // job.timeCountdown = countdown(undefined, end, this.countdownUnits);
    //         }
    //     }
    //
    //     for (const job of industryJobs) {
    //         if (job.output_location_id > Calc.maxIntegerValue) {
    //             if (CharacterService.selectedCharacter && IndustrySystemOverviewComponent.hasStructuresScope) {
    //                 const structure = await this.structuresService.getStructureInfo(
    //                     CharacterService.selectedCharacter, job.output_location_id);
    //                 if (structure) {
    //                     job.locationName = structure.name;
    //                     job.locationSystem = structure.solar_system_id;
    //                 }
    //             } else {
    //                 job.locationName = 'An unknown Upwell structure';
    //             }
    //         } else {
    //             const station = await this.stationsService.getStationInfo(job.output_location_id);
    //             if (station) {
    //                 job.locationName = station.name;
    //                 job.locationSystem = station.system_id;
    //             }
    //         }
    //     }
    // }
}
