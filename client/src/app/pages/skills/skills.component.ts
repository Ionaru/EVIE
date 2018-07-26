import { Component, OnInit } from '@angular/core';
import * as countdown from 'countdown';
import Timespan = countdown.Timespan;

import { IESINamesData, INames, NamesService } from '../../data-services/names.service';
import { ISkillGroupData, SkillGroupsService } from '../../data-services/skill-groups.service';
import { ISkillQueueData, SkillQueueService } from '../../data-services/skillqueue.service';
import { ISkillData, ISkillsData, SkillsService } from '../../data-services/skills.service';
import { CharacterService } from '../../models/character/character.service';
import { Helpers } from '../../shared/helpers';
import { DataPageComponent } from '../data-page/data-page.component';

interface IExtendedSkillQueueData extends ISkillQueueData {
    status?: 'training' | 'finished' | 'scheduled' | 'inactive';
    countdown?: number | Timespan;
    name?: string;
    spAtEnd?: number;
    spLeft?: number;
    percentageDone?: number;
}

interface IExtendedSkillData extends ISkillData {
    name?: string;
}

interface ISKILLNAME {
    name?: string;
}

interface IExtendedSkillsData extends ISkillsData {
    skills: IExtendedSkillData[];
}

interface ISKILLS {
    [skillId: number]: IExtendedSkillData | ISKILLNAME;
}

interface IGROUPS extends ISkillGroupData {
    skills?: ISKILLS;
}

interface IALL {
    [groupId: number]: IGROUPS;
}

@Component({
    selector: 'app-wallet',
    styleUrls: ['./skills.component.scss'],
    templateUrl: './skills.component.html',
})
export class SkillsComponent extends DataPageComponent implements OnInit {

    public skillQueue: IExtendedSkillQueueData[] = [];
    public skillQueueCount = 0;
    public skills?: IExtendedSkillsData;
    public skillTrainingPaused = true;
    public totalQueueTime = 0;
    public totalQueueCountdown?: number | Timespan;
    public skillQueueTimeLeft = 0;

    public skillPoints = 0;

    public spPerSec = 0;
    public skillQueueTimer?: number;
    public totalQueueTimer?: number;
    public updateQueueTimer?: number;

    public skillGroups!: ISkillGroupData[];
    public skillList: {
        [groupId: number]: IExtendedSkillData[],
    } = {};

    public skillQueueVisible = true;

    public allSkills: IALL = {};

    // tslint:disable-next-line:no-bitwise
    private countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    constructor(private skillQueueService: SkillQueueService, private skillsService: SkillsService, private namesService: NamesService,
                private skillGroupsService: SkillGroupsService) {
        super();
    }

    public async ngOnInit() {
        super.ngOnInit();
        this.allSkills = {};
        await Promise.all([this.getSkillQueue(), this.getSkills(), this.setSkillGroups()]);
        this.parseSkillQueue();
    }

    public parseSkillQueue() {

        // this.allSkills = {};

        this.resetTimers();
        this.totalQueueTime = Date.now();
        this.skillTrainingPaused = true;

        if (this.skills) {
            this.skillPoints = this.skills.total_sp;

            for (const skill of this.skills.skills) {
                skill.name = NamesService.getNameFromData(skill.skill_id, 'Unknown skill');
            }
        }

        for (const group of this.skillGroups) {
            const skillsGorGroup = this.getSkillsForGroup(group);
            if (skillsGorGroup) {
                this.skillList[group.group_id] = skillsGorGroup;

                // console.log(this.allSkills[group.group_id]);

                for (const skill of skillsGorGroup) {
                    // console.log(skill.skill_id);

                    // TODO: CHECK /TYPES/TYPEID IF SKILL IS PUBLISHED
                    this.allSkills[group.group_id].skills[skill.skill_id] = skill;
                }
            }
        }

        // console.log(this.allSkills);

        for (const skillInQueue of this.skillQueue) {
            skillInQueue.name = NamesService.getNameFromData(skillInQueue.skill_id, 'Unknown skill');

            if (skillInQueue.start_date && skillInQueue.finish_date && skillInQueue.training_start_sp && skillInQueue.level_end_sp) {
                const now = new Date();
                const skillFinishDate = new Date(skillInQueue.finish_date);
                const skillStartDate = new Date(skillInQueue.start_date);
                skillInQueue.spLeft = skillInQueue.level_end_sp - skillInQueue.training_start_sp;

                if (skillFinishDate < now) {
                    // This skill finished training sometime in the past.
                    skillInQueue.status = 'finished';
                    this.skillPoints += skillInQueue.spLeft;

                } else if (skillStartDate < now) {
                    // This skill was started sometime in the past, and because the above statement failed,
                    // we can assume it's not finished yet.
                    skillInQueue.status = 'training';

                    const timeLeftInSkill = (skillFinishDate.getTime() - now.getTime());
                    this.totalQueueTime += timeLeftInSkill;

                    this.skillTrainingPaused = false;

                    // SKill time calculations
                    const skillTrainingDuration = skillFinishDate.getTime() - skillStartDate.getTime();
                    const timeExpired = skillTrainingDuration - timeLeftInSkill;

                    // Skill point calculations
                    this.spPerSec = skillInQueue.spLeft / (skillTrainingDuration / 1000);
                    let spGained = (this.spPerSec * (timeExpired / 1000));
                    skillInQueue.spLeft = skillInQueue.spLeft - spGained;

                    // Calculate % done.
                    if (skillInQueue.level_start_sp) {
                        skillInQueue.percentageDone = (spGained / (skillInQueue.level_end_sp - skillInQueue.level_start_sp)) * 100;
                    }

                    this.skillPoints += (this.spPerSec * (timeExpired / 1000));
                    skillInQueue.spAtEnd = this.skillPoints + skillInQueue.spLeft;

                    skillInQueue.countdown = countdown(Date.now(), skillFinishDate, this.countdownUnits);

                    // Update spPerSec and skill time countdown every second.
                    this.skillQueueTimer = window.setInterval(() => {
                        this.skillPoints += this.spPerSec;
                        spGained += this.spPerSec;
                        if (skillInQueue.spLeft) {
                            skillInQueue.spLeft = skillInQueue.spLeft -= this.spPerSec;
                        }
                        if (skillInQueue.level_start_sp && skillInQueue.level_end_sp) {
                            skillInQueue.percentageDone = (spGained / (skillInQueue.level_end_sp - skillInQueue.level_start_sp)) * 100;
                        }
                        skillInQueue.countdown = countdown(Date.now(), skillFinishDate, this.countdownUnits);
                    }, 1000);

                    // Update the list when a skill finishes training.
                    this.updateQueueTimer = window.setTimeout(() => {
                        this.parseSkillQueue();
                    }, timeLeftInSkill);

                } else {
                    // The skill is neither started nor finished, it must be scheduled to start in the future.
                    skillInQueue.status = 'scheduled';

                    // Get and add the amount of SP gained so far by the skill in training.
                    let spBeforeThisSkill = this.skillPoints;
                    const skillInTraining = this.skillQueue.filter((skill) => skill.status === 'training');
                    if (skillInTraining[0].spAtEnd) {
                        spBeforeThisSkill = skillInTraining[0].spAtEnd as number;
                    }

                    // Get and add the amount of SP from previouslu scheduled skills.
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
                }
            } else {
                skillInQueue.status = 'inactive';
            }
        }

        this.skillQueue = this.skillQueue.filter((skill) => skill.status !== 'inactive');
        this.skillQueueCount = this.skillQueue.filter((_) => _.status && ['training', 'scheduled'].includes(_.status)).length;
        if (this.skillQueueCount) {
            this.totalQueueTimer = Helpers.repeat(() => {
                const now = Date.now();
                this.skillQueueTimeLeft = this.totalQueueTime - now;
                this.totalQueueCountdown = countdown(now, this.totalQueueTime, this.countdownUnits);
            }, 1000);
        }
    }

    public resetTimers() {
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

    public skillQueueLow() {
        return !this.skillTrainingPaused && this.skillQueueTimeLeft < (24 * 60 * 60 * 1000);
    }

    public async getSkillQueue() {
        if (CharacterService.selectedCharacter) {
            this.skillQueue = await this.skillQueueService.getSkillQueue(CharacterService.selectedCharacter);
            const skillIds = this.skillQueue.map((e) => e.skill_id);
            await this.namesService.getNames(...skillIds);
        }
    }

    public async getSkills() {
        if (CharacterService.selectedCharacter) {
            this.skills = await this.skillsService.getSkillsData(CharacterService.selectedCharacter);
            if (this.skills) {
                await this.namesService.getNames(...this.skills.skills.map((e) => e.skill_id));
            }
        }
    }

    public getSkillsForGroup(group: ISkillGroupData) {
        if (this.skills) {
            let skills = this.skills.skills.filter((_) => group.types.indexOf(_.skill_id) !== -1);
            skills = Helpers.sortArrayByObjectProperty(skills, 'name');
            return skills;
        }
    }

    public getSkillsInGroup(groupId: number) {
        console.log(this.allSkills[groupId].skills);
        return Helpers.sortArrayByObjectProperty(Object.values(this.allSkills[groupId].skills), 'name');
    }

    public async setSkillGroups() {
        this.skillGroups = await this.skillGroupsService.getSkillGroupInformation();
        const groupedSkillIds = this.skillGroups.map((group) => group.types);
        const allSkills = [].concat(...groupedSkillIds as any);
        await this.namesService.getNames(...allSkills);

        for (const group of this.skillGroups) {
            this.allSkills[group.group_id] = group;
            this.allSkills[group.group_id].skills = {};

            for (const type of group.types) {
                this.allSkills[group.group_id].skills[type] = {name: NamesService.getNameFromData(type)};
            }
        }

        // console.log(this.allSkills);
    }

    public countLvl5Skills(): number {
        if (this.skills) {
            return this.skills.skills.filter((_) => _.active_skill_level === 5).length;
        }
        return 0;
    }

    public getSkillGroup(skillId: number) {
        return this.skillGroups.filter((_) => _.types.indexOf(skillId) !== -1)[0].name;
    }

    public toggleSkillQueueVisible() {
        this.skillQueueVisible = !this.skillQueueVisible;
    }

    public getSPInGroup(groupId: number) {
        let sp = 0;
        for (const skill of this.skillList[groupId]) {
            sp += skill.skillpoints_in_skill;
        }
        return sp;
    }
}
