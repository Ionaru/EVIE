import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import {
    faArrowAltRight,
    faChevronDown,
    faClock,
    faCog,
    faExclamationTriangle,
    faFolderOpen,
} from '@fortawesome/pro-solid-svg-icons';
import Timespan = countdown.Timespan;
import { objectsArrayToObject, sortArrayByObjectProperty } from '@ionaru/array-utils';
import {
    ICharacterAttributesData,
    ICharacterSkillQueueDataUnit,
    ICharacterSkillsData,
    ISkillsData,
    IUniverseGroupData,
    IUniverseTypeData,
} from '@ionaru/eve-utils';
import { romanize } from '@ionaru/romanize';
import * as countdown from 'countdown';

import { Calc } from '../../../shared/calc.helper';
import { AttributesService } from '../../data-services/attributes.service';
import { NamesService } from '../../data-services/names.service';
import { SkillGroupsService } from '../../data-services/skill-groups.service';
import { SkillQueueService } from '../../data-services/skillqueue.service';
import { SkillsService } from '../../data-services/skills.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { Scope } from '../scopes/scopes.component';
import { createTitle } from '../../shared/title';

type skillStatus = 'training' | 'finished' | 'scheduled' | 'inactive';

interface IExtendedSkillQueueData extends ICharacterSkillQueueDataUnit {
    status?: skillStatus;
    countdown?: number | countdown.Timespan;
    name?: string;
    spAtEnd?: number;
    spLeft?: number;
    percentageDone?: number;
}

interface IExtendedSkillData extends ISkillsData {
    name?: string;
}

interface IExtendedSkillsData extends ICharacterSkillsData {
    skills: IExtendedSkillData[];
}

interface ITrainedSkills {
    [skillId: number]: IExtendedSkillData;
}

interface IGroupedSKillData {
    [groupId: number]: IExtendedSkillData[];
}

interface IGroupedSkillTypes {
    [groupId: number]: IUniverseTypeData[];
}

@Component({
    selector: 'app-wallet',
    styleUrls: ['./skills.component.scss'],
    templateUrl: './skills.component.html',
})
export class SkillsComponent extends DataPageComponent implements OnInit, OnDestroy {

    public faChevronDown = faChevronDown;
    public faExclamationTriangle = faExclamationTriangle;
    public faCog = faCog;
    public faClock = faClock;
    public faFolderOpen = faFolderOpen;
    public faArrowAltRight = faArrowAltRight;
    public faEye = faEye;
    public faEyeSlash = faEyeSlash;

    public skillQueue: IExtendedSkillQueueData[] = [];
    public skillQueueCount = 0;
    public skills?: IExtendedSkillsData;
    public skillTrainingPaused = false;
    public totalQueueTime = 0;
    public totalQueueCountdown?: number | countdown.Timespan;
    public skillQueueTimeLeft = 0;

    public totalSP = 0;

    public showUntrainedSkills = false;

    public hasLowSkillQueue = false;

    public spPerSec = 0;
    public skillQueueTimer?: number;
    public totalQueueTimer?: number;
    public updateQueueTimer?: number;

    public skillGroups: IUniverseGroupData[] = [];
    public skillList: IGroupedSKillData = {};

    public skillQueueVisible = true;

    public skillTypes?: IUniverseTypeData[];

    public trainedSkills?: ITrainedSkills;

    public attributes?: ICharacterAttributesData;

    public currentTrainingSkill?: number;
    public currentTrainingSPGain?: number;
    public currentTrainingSPEnd?: number;

    public trainedSkillsGrouped: IGroupedSkillTypes = {};
    public skillsGrouped: IGroupedSkillTypes = {};
    public trainedSkillIds: number[] = [];

    // tslint:disable-next-line:no-bitwise
    private readonly countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    public static adjustCountDownForDST(cd: Timespan, timeLeft: number) {
        cd.hours = Calc.wholeHours(timeLeft) - (Calc.wholeDays(timeLeft) * 24);
    }

    constructor(
        private skillQueueService: SkillQueueService,
        private skillsService: SkillsService,
        private namesService: NamesService,
        private skillGroupsService: SkillGroupsService,
        private attributesService: AttributesService,
        private title: Title,
    ) {
        super();
        this.requiredScopes = [Scope.SKILLS];
    }

    public ngOnInit() {
        super.ngOnInit();
        this.title.setTitle(createTitle('Skills'));

        if (this.hasSkillsScope) {
            this.getAttributes().then();
        }

        Promise.all([
            this.hasSkillQueueScope ? this.getSkillQueue() : undefined,
            this.hasSkillsScope ? this.getSkills() : undefined,
            this.hasSkillsScope ? this.setSkillGroups() : undefined,
        ]).then(() => this.parseSkillQueue());
    }

    public async ngOnDestroy() {
        super.ngOnDestroy();
        this.resetTimers();
    }

    public romanize = (num: number) => romanize(num);

    public countLvl5Skills = () => this.skills ? this.skills.skills.filter((skill) => skill.active_skill_level === 5).length : 0;

    // tslint:disable-next-line:no-non-null-assertion
    public getSkillGroup = (skillId: number) => this.skillGroups.find((group) => group.types.includes(skillId))!.name;

    public skillQueueLow = () => !this.skillTrainingPaused && this.skillQueueTimeLeft < Calc.day;

    public get hasSkillsScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.SKILLS);
    }

    public get hasSkillQueueScope() {
        return CharacterService.selectedCharacter && CharacterService.selectedCharacter.hasScope(Scope.SKILLQUEUE);
    }

    public async getAttributes() {
        if (CharacterService.selectedCharacter) {
            this.attributes = await this.attributesService.getAttributes(CharacterService.selectedCharacter);
        }
    }

    public getSkillsForGroup(group: IUniverseGroupData) {
        if (this.skills) {
            const skills = this.skills.skills.filter((skill) => group.types.includes(skill.skill_id));
            return sortArrayByObjectProperty(skills, (skill) => skill.name || '');
        }
        return [];
    }

    public getSkillList(group: IUniverseGroupData, allSkills = true) {

        let skills: IUniverseTypeData[] = [];

        if (this.skillTypes) {
            skills = this.skillTypes.filter((skill) => skill.group_id === group.group_id);
            if (!allSkills && this.skills) {
                skills = skills.filter((skill) => this.trainedSkillIds.includes(skill.type_id));
            }
        }

        return sortArrayByObjectProperty(skills, (skill) => skill.name);
    }

    public getSPInGroup(groupId: number) {
        let sp = 0;
        if (this.skillList[groupId]) {
            for (const skill of this.skillList[groupId]) {
                sp += skill.skillpoints_in_skill;
            }
        }
        return sp;
    }

    private updateQueueCountdown() {
        const now = Date.now();
        this.skillQueueTimeLeft = this.totalQueueTime - now;
        this.totalQueueCountdown = countdown(now, this.totalQueueTime, this.countdownUnits);

        // Adjust for DST
        if (typeof this.totalQueueCountdown !== 'number') {
            SkillsComponent.adjustCountDownForDST(this.totalQueueCountdown, this.skillQueueTimeLeft);
        }

        if (this.skillQueueLow()) {
            this.hasLowSkillQueue = true;
        }
    }

    private async setSkillGroups() {
        const skillGroups = await this.skillGroupsService.getSkillGroupInformation();
        this.skillGroups = sortArrayByObjectProperty(skillGroups, (group) => group.name);
    }

    private resetTimers() {
        if (this.totalQueueTimer) {
            clearInterval(this.totalQueueTimer);
        }

        if (this.skillQueueTimer) {
            clearInterval(this.skillQueueTimer);
        }

        if (this.updateQueueTimer) {
            clearInterval(this.updateQueueTimer);
        }
    }

    private async getSkillQueue() {
        if (CharacterService.selectedCharacter) {
            this.skillQueue = await this.skillQueueService.getSkillQueue(CharacterService.selectedCharacter);
            const skillIds = this.skillQueue.map((skill) => skill.skill_id);
            await this.namesService.getNames(...skillIds);
        }
    }

    private async getSkills() {
        if (CharacterService.selectedCharacter) {
            const skills = await this.skillsService.getSkillsData(CharacterService.selectedCharacter);
            if (skills) {
                await this.namesService.getNames(...skills.skills.map((skill) => skill.skill_id));
                for (const skill of skills.skills) {
                    (skill as IExtendedSkillData).name = NamesService.getNameFromData(skill.skill_id, 'Unknown skill');
                }
                this.trainedSkillIds = skills.skills.map((trainedSkill) => trainedSkill.skill_id);
                this.skills = skills;
            }
        }

        this.skillTypes = await this.skillsService.getAllSkills();
    }

    // tslint:disable-next-line:cognitive-complexity
    private parseSkillQueue() {

        this.resetTimers();
        this.totalQueueTime = Date.now();
        this.skillTrainingPaused = true;

        if (this.skills) {
            this.totalSP = this.skills.total_sp;
        }

        for (const group of this.skillGroups) {
            const skillsGorGroup = this.getSkillsForGroup(group);
            if (skillsGorGroup) {
                this.skillList[group.group_id] = skillsGorGroup;
            }

            this.skillsGrouped[group.group_id] = this.getSkillList(group);

            this.trainedSkillsGrouped[group.group_id] = this.skillsGrouped[group.group_id].filter(
                (skill) => this.trainedSkillIds.includes(skill.type_id),
            );
        }

        if (this.skills) {
            this.trainedSkills = objectsArrayToObject(this.skills.skills, (skill) => skill.skill_id);
        }

        if (!this.hasSkillQueueScope) {
            return;
        }

        for (const skillInQueue of this.skillQueue) {
            skillInQueue.name = NamesService.getNameFromData(skillInQueue.skill_id, 'Unknown skill');

            if (skillInQueue.start_date && skillInQueue.finish_date && skillInQueue.training_start_sp !== undefined &&
                skillInQueue.level_end_sp && skillInQueue.level_start_sp !== undefined) {

                const now = new Date();
                const nowTime = now.getTime();
                const skillFinishDate = new Date(skillInQueue.finish_date);
                const skillStartDate = new Date(skillInQueue.start_date);
                skillInQueue.spLeft = skillInQueue.level_end_sp - skillInQueue.training_start_sp;

                if (skillFinishDate < now) {
                    // This skill finished training sometime in the past.
                    skillInQueue.status = 'finished';
                    this.totalSP += skillInQueue.spLeft;

                } else if (skillStartDate < now) {
                    // This skill was started sometime in the past, and because the above statement failed,
                    // we can assume it's not finished yet.
                    skillInQueue.status = 'training';
                    this.skillTrainingPaused = false;
                    this.currentTrainingSkill = skillInQueue.skill_id;

                    const startTrainingToFinishTime = skillFinishDate.getTime() - skillStartDate.getTime();

                    const startTrainingToFinishSP = skillInQueue.level_end_sp - skillInQueue.training_start_sp;

                    this.spPerSec = startTrainingToFinishSP / Calc.millisecondsToSeconds(startTrainingToFinishTime);

                    const timeSpentSinceStartTraining = nowTime - skillStartDate.getTime();
                    const skillPointsTrained = this.spPerSec * Calc.millisecondsToSeconds(timeSpentSinceStartTraining);
                    const currentSPInSkill = skillInQueue.training_start_sp + skillPointsTrained;

                    const currentSPInSkillLevel = currentSPInSkill - skillInQueue.level_start_sp;
                    const skillLevelSP = skillInQueue.level_end_sp - skillInQueue.level_start_sp;

                    let spGained = currentSPInSkillLevel - (skillInQueue.training_start_sp - skillInQueue.level_start_sp);
                    this.totalSP += spGained;
                    const timeLeftInSkill = skillFinishDate.getTime() - nowTime;
                    this.totalQueueTime += timeLeftInSkill;

                    skillInQueue.countdown = countdown(nowTime, skillFinishDate, this.countdownUnits);
                    skillInQueue.spLeft = skillInQueue.spLeft - spGained;
                    skillInQueue.percentageDone = Calc.partPercentage(currentSPInSkillLevel, skillLevelSP);
                    skillInQueue.spAtEnd = this.totalSP + skillInQueue.spLeft;

                    this.currentTrainingSPGain = spGained;
                    this.currentTrainingSPEnd = skillInQueue.level_end_sp;

                    // Adjust for DST
                    if (typeof skillInQueue.countdown !== 'number') {
                        SkillsComponent.adjustCountDownForDST(skillInQueue.countdown, timeLeftInSkill);
                    }

                    // Update spPerSec and skill time countdown every second.
                    this.skillQueueTimer = window.setInterval(() => {

                        if (skillInQueue.spLeft) {
                            skillInQueue.spLeft = skillInQueue.spLeft -= this.spPerSec;
                        }
                        if (skillInQueue.level_start_sp && skillInQueue.level_end_sp) {
                            skillInQueue.percentageDone = Calc.partPercentage(currentSPInSkillLevel, skillLevelSP);
                        }

                        this.totalSP += this.spPerSec;

                        spGained += this.spPerSec;
                        this.currentTrainingSPGain = spGained;

                        skillInQueue.countdown = countdown(Date.now(), skillFinishDate, this.countdownUnits);

                        // Adjust for DST
                        if (typeof skillInQueue.countdown !== 'number') {
                            SkillsComponent.adjustCountDownForDST(skillInQueue.countdown, skillFinishDate.getTime() - Date.now());
                        }
                    }, Calc.second);

                    // Update the list when a skill finishes training.
                    if (timeLeftInSkill < Calc.maxIntegerValue) {
                        this.updateQueueTimer = window.setTimeout(() => {
                            this.parseSkillQueue();
                        }, timeLeftInSkill);
                    }

                } else {
                    // The skill is neither started nor finished, it must be scheduled to start in the future.
                    skillInQueue.status = 'scheduled';

                    // Get and add the amount of SP gained so far by the skill in training.
                    let spBeforeThisSkill = this.totalSP;
                    const skillInTraining = this.skillQueue.find((skill) => skill.status === 'training');
                    if (skillInTraining && skillInTraining.spAtEnd) {
                        spBeforeThisSkill = skillInTraining.spAtEnd;
                    }

                    // Get and add the amount of SP from previously scheduled skills.
                    const skillInQueueIndex = this.skillQueue.indexOf(skillInQueue);
                    const finishedSkillBeforeThis = this.skillQueue.filter((skill) =>
                        this.skillQueue.indexOf(skill) < skillInQueueIndex && skill.status === 'scheduled');
                    for (const beforeSkill of finishedSkillBeforeThis) {
                        if (beforeSkill.spLeft) {
                            spBeforeThisSkill += beforeSkill.spLeft;
                        }
                    }

                    skillInQueue.spAtEnd = spBeforeThisSkill + skillInQueue.spLeft;

                    this.totalQueueTime += (skillFinishDate.getTime() - skillStartDate.getTime());
                    skillInQueue.countdown = countdown(skillStartDate, skillFinishDate, this.countdownUnits);

                    // Adjust for DST
                    if (typeof skillInQueue.countdown !== 'number') {
                        const timeLeft = skillFinishDate.getTime() - skillStartDate.getTime();
                        SkillsComponent.adjustCountDownForDST(skillInQueue.countdown, timeLeft);
                    }
                }

            } else {
                skillInQueue.status = 'inactive';
                this.spPerSec = 0;
            }
        }

        this.skillQueue = this.skillQueue.filter((skill) => skill.status !== 'inactive');
        this.skillQueueCount = this.skillQueue.filter((skill) => skill.status && ['training', 'scheduled'].includes(skill.status)).length;
        this.updateQueueCountdown();
        if (this.skillQueueCount) {
            this.totalQueueTimer = window.setInterval(() => {
                this.updateQueueCountdown();
            }, Calc.second);
        }
    }
}
