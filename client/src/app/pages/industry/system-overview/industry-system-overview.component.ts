import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
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
import { Character } from '../../../models/character/character.model';
import { CharacterService } from '../../../models/character/character.service';
import { UserService } from '../../../models/user/user.service';
import { Scope } from '../../scopes/scopes.component';
import { IBlueprints, IExtendedIndustryJobsData, IndustryComponent } from '../industry.component';
import { createTitle } from '../../../shared/title';

interface ISystemOverviewSystem {
    readyJobs: number;
    totalJobs: number;
    inProgressJobs: number;
    securityClass: string;
    securityStatus: number;
    name: string;
    id: number;
    locations: ISystemOverviewLocation[];
}

interface ISystemOverviewLocation {
    jobs: IExtendedIndustryJobsData[];
    name: string;
    type: string;
}

interface ICharacterJobCounts {
    [index: string]: {
        readyJobs: number;
        totalJobs: number;
        inProgressJobs: number;
    };
}

interface ILocationInfo {
    stationName: string;
    system: number;
    type: string;
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

    public selectedCharacters: Character[] = [];

    public allCharacters: Character[] = UserService.user.characters;

    public characterJobs: ICharacterJobCounts = {};

    constructor(
        private industryJobsService: IndustryJobsService,
        private blueprintsService: BlueprintsService,
        private namesService: NamesService,
        private stationsService: StationsService,
        private structuresService: StructuresService,
        private systemService: SystemsService,
        private title: Title,
    ) {
        super();
        this.title.setTitle(createTitle('Industry: System Overview'));
        countdown.setLabels(
            '|s|m|h|d',
            '|s|m|h|d',
            ', ');
        this.requiredScopes = [
            Scope.STRUCTURES,
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

        if (!this.selectedCharacters.length && CharacterService.selectedCharacter) {
            this.selectedCharacters = [CharacterService.selectedCharacter];
        }

        this.industryJobs = [];
        this.blueprints = {};

        this.getAndProcessData();
    }

    public async getAndProcessData() {
        await Promise.all(this.selectedCharacters.map(async (character) => {
            return Promise.all([
                this.getBlueprints(character),
                this.getIndustryJobs(character),
            ]);
        }));

        await this.processIndustryJobs();

        for (const character of this.selectedCharacters) {
            this.countJobsForCharacter(character);
        }
    }

    public async addCharacterToOverview(character: Character, icon?: FaIconComponent) {
        if (icon) {
            icon.icon = this.busyIcon;
            icon.spin = true;
            icon.render();
        }

        await Promise.all([
            this.getBlueprints(character),
            this.getIndustryJobs(character),
        ]);
        this.selectedCharacters.push(character);
        await this.processIndustryJobs();
        this.countJobsForCharacter(character);

        if (icon) {
            icon.icon = this.addIcon;
            icon.spin = false;
            icon.render();
        }
    }

    public countJobsForCharacter(character: Character) {
        let jobCounter = this.characterJobs[character.characterId];

        if (!jobCounter) {
            jobCounter = {
                inProgressJobs: 0,
                readyJobs: 0,
                totalJobs: 0,
            };
        }

        const jobsForCharacter = this.industryJobs.filter((job) => job.installer_id === character.characterId);
        jobCounter.totalJobs = jobsForCharacter.length;

        jobCounter.readyJobs = jobsForCharacter.filter((job) => {
            return job.timeLeft !== undefined && job.timeLeft <= 0;
        }).length;

        jobCounter.inProgressJobs = jobCounter.totalJobs - jobCounter.readyJobs;

        this.characterJobs[character.characterId] = jobCounter;
    }

    public async removeCharacterFromOverview(character: Character) {
        this.resetTimers();
        this.industryJobs = this.industryJobs.filter((job) => job.installer_id !== character.characterId);
        this.selectedCharacters = this.selectedCharacters.filter((selectedCharacter) => selectedCharacter !== character);
        this.processIndustryJobs().then();
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        this.resetTimers();
    }

    public hasRequiredScopes(character: Character) {
        return character.hasScope(
            Scope.STRUCTURES,
            Scope.BLUEPRINTS,
            Scope.JOBS,
        );
    }

    public async getLocation(job: IExtendedIndustryJobsData): Promise<ILocationInfo | undefined> {

        if (job.output_location_id > Calc.maxIntegerValue) {
            const jobOwner = this.selectedCharacters.find((character) => character.characterId === job.installer_id);
            if (jobOwner && jobOwner.hasScope(Scope.STRUCTURES)) {
                const structure = await this.structuresService.getStructureInfo(
                    jobOwner, job.output_location_id);
                if (structure) {

                    let type = 'Upwell structure';
                    if (structure.type_id) {
                        await this.namesService.getNames(structure.type_id);
                        type = NamesService.getNameFromData(structure.type_id);
                    }

                    return {
                        stationName: structure.name,
                        system: structure.solar_system_id,
                        type,
                    };
                }
            }
        } else {
            const station = await this.stationsService.getStationInfo(job.output_location_id);
            if (station) {

                await this.namesService.getNames(station.type_id);
                const type = NamesService.getNameFromData(station.type_id);

                return {
                    stationName: station.name,
                    system: station.system_id,
                    type,
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

    public async getBlueprints(character: Character) {
        if (character.hasScope(Scope.BLUEPRINTS)) {
            const blueprintData = await this.blueprintsService.getBlueprints(character);
            const blueprints = objectsArrayToObject(blueprintData, 'item_id');
            this.blueprints = {...this.blueprints, ...blueprints};
        }
    }

    public async getIndustryJobs(character: Character) {
        if (character.hasScope(Scope.JOBS)) {
            const industryJobs = await this.industryJobsService.getIndustryJobs(character);
            this.industryJobs.push(...industryJobs);
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

                this.setImageTypes(this.blueprints, job);

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
                        type: location.type,
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
        }

        this.overview = overviewData;
    }

    public setJobCounts(systemOverview: ISystemOverviewSystem, job: IExtendedIndustryJobsData) {

        systemOverview.totalJobs++;

        if (job.timeLeft !== undefined && job.timeLeft <= 0) {
            systemOverview.readyJobs++;
        } else {
            systemOverview.inProgressJobs++;
        }
    }

    public setMiscJobData(job: IExtendedIndustryJobsData) {
        if (job.product_type_id) {
            job.productName = NamesService.getNameFromData(job.product_type_id);
        }

        job.activityIcon = this.getIconForIndustryActivity(job.activity_id);
        job.installerName = this.getInstallerName(job.installer_id);
    }

    public processSystemInfo(overviewData: ISystemOverviewSystem[], systemInfo: IUniverseSystemData): ISystemOverviewSystem {
        let systemOverview: ISystemOverviewSystem | undefined = overviewData.find((s) => {
            return s.id === systemInfo.system_id;
        });

        if (!systemOverview) {
            systemOverview = {
                id: systemInfo.system_id,
                inProgressJobs: 0,
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
