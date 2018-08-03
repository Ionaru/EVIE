import { Component, OnInit } from '@angular/core';
import * as countdown from 'countdown';
import Timespan = countdown.Timespan;

import { Common } from '../../../shared/common.helper';
import { ISkillData, ISkillGroupData, ISkillQueueData, ISkillsData, ITypesData } from '../../../shared/interface.helper';
import { NamesService } from '../../data-services/names.service';
import { SkillGroupsService } from '../../data-services/skill-groups.service';
import { SkillQueueService } from '../../data-services/skillqueue.service';
import { SkillsService } from '../../data-services/skills.service';
import { CharacterService } from '../../models/character/character.service';
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

interface ITrainedSkills {
    [skillId: number]: IExtendedSkillData;
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
    public skillTrainingPaused = false;
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

    public skillTypes?: ITypesData[];

    public trainedSkills?: ITrainedSkills;

    public currentTrainingSkill?: number;
    public currentTrainingSPGain?: number;

    // public allSkills: IALL = {};

    // tslint:disable-next-line:no-bitwise
    private countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    constructor(private skillQueueService: SkillQueueService, private skillsService: SkillsService, private namesService: NamesService,
                private skillGroupsService: SkillGroupsService) {
        super();
    }

    public async ngOnInit() {
        super.ngOnInit();
        await Promise.all([this.getSkillQueue(), this.getSkills(), this.setSkillGroups()]);

        this.parseSkillQueue();
    }

    public parseSkillQueue() {

        this.resetTimers();
        this.totalQueueTime = Date.now();
        this.skillTrainingPaused = true;

        if (this.skills) {
            this.skillPoints = this.skills.total_sp;

            this.trainedSkills = Common.objectsArrayToObject(this.skills.skills, 'skill_id');
        }

        for (const group of this.skillGroups) {
            const skillsGorGroup = this.getSkillsForGroup(group);
            if (skillsGorGroup) {
                this.skillList[group.group_id] = skillsGorGroup;
            }
        }

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

                    this.skillPoints += spGained;
                    skillInQueue.spAtEnd = this.skillPoints + skillInQueue.spLeft;

                    skillInQueue.countdown = countdown(Date.now(), skillFinishDate, this.countdownUnits);

                    this.currentTrainingSkill = skillInQueue.skill_id;
                    this.currentTrainingSPGain = spGained;

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
                        this.currentTrainingSPGain = spGained;
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
            this.totalQueueTimer = window.setInterval(() => {
                this.updateQueueCountdown();
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

    public getTrainedSkill(id: number) {
        if (this.skills) {
            return this.skills.skills.filter((skill) => skill.skill_id === id);
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
            const skills = await this.skillsService.getSkillsData(CharacterService.selectedCharacter);
            if (skills) {
                await this.namesService.getNames(...skills.skills.map((e) => e.skill_id));
                for (const skill of skills.skills) {
                    (skill as IExtendedSkillData).name = NamesService.getNameFromData(skill.skill_id, 'Unknown skill');
                }
            }

            this.skills = skills;
        }

        this.skillTypes = await this.skillsService.getAllSkills();
    }

    public getSkillsForGroup(group: ISkillGroupData) {
        if (this.skills) {
            let skills = this.skills.skills.filter((_) => group.types.indexOf(_.skill_id) !== -1);
            skills = Common.sortArrayByObjectProperty(skills, 'name');
            return skills;
        }
        return [];
    }

    public getSkillsInGroup(group: ISkillGroupData) {
        // console.log(this.allSkills[groupId].skills);
        if (this.skillTypes) {
            return Common.sortArrayByObjectProperty(this.skillTypes.filter((skill) => skill.group_id === group.group_id), 'name');
        }
        return [];
    }

    public getSkillList(group: ISkillGroupData, allSkills = true) {

        let skills: ITypesData[] = [];

        if (this.skillTypes) {
            skills = this.skillTypes.filter((skill) => skill.group_id === group.group_id);
            console.log(allSkills);
            if (!allSkills && this.skills) {
                skills.filter((skill) => this.skills!.skills.map((trainedSkill) => trainedSkill.skill_id).includes(skill.type_id));
            }
        }

        return Common.sortArrayByObjectProperty(skills, 'name');
    }

    public async setSkillGroups() {
        this.skillGroups = await this.skillGroupsService.getSkillGroupInformation();
        // const groupedSkillIds = this.skillGroups.map((group) => group.types);
        // const allSkills = [].concat(...groupedSkillIds as any);
        // await this.namesService.getNames(...allSkills);

        // for (const group of this.skillGroups) {
            // this.allSkills[group.group_id] = group;
            // this.allSkills[group.group_id].skills = {};

            // for (const type of group.types) {
            //     this.allSkills[group.group_id].skills![type] = {name: NamesService.getNameFromData(type)};
            // }
        // }

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
        if (this.skillList[groupId]) {
            for (const skill of this.skillList[groupId]) {
                sp += skill.skillpoints_in_skill;
            }
        }
        return sp;
    }

    public romanize(num: number) {
        return Common.romanize(num);
    }

    private updateQueueCountdown() {
        const now = Date.now();
        this.skillQueueTimeLeft = this.totalQueueTime - now;
        this.totalQueueCountdown = countdown(now, this.totalQueueTime, this.countdownUnits);
    }
}
