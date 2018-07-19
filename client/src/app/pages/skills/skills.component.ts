import { Component, OnDestroy, OnInit } from '@angular/core';
import * as countdown from 'countdown';
import { Subscription } from 'rxjs';

import { NamesService } from '../../data-services/names.service';
import { ISkillQueueData, SkillQueueService } from '../../data-services/skillqueue.service';
import { ISkillsData, SkillsService } from '../../data-services/skills.service';
import { CharacterService } from '../../models/character/character.service';
import { Helpers } from '../../shared/helpers';
import Timespan = countdown.Timespan;

interface IExtendedSkillData extends ISkillQueueData {
    status?: 'training' | 'finished' | 'scheduled' | 'inactive';
    countdown?: number | Timespan;
    name?: string;
    spAtEnd?: number;
    spLeft?: number;
}

@Component({
    selector: 'app-wallet',
    styleUrls: ['./skills.component.scss'],
    templateUrl: './skills.component.html',
})
export class SkillsComponent implements OnInit, OnDestroy {

    public skillQueue: IExtendedSkillData[] = [];
    public skillQueueCount = 0;
    public skills?: ISkillsData;
    public skillTrainingPaused = true;
    public totalQueueTime = 0;
    public totalQueueCountdown?: number | Timespan;
    public skillQueueTimeLeft = 0;

    public skillPoints = 0;

    public spPerSec = 0;
    public skillQueueTimer?: number;
    public totalQueueTimer?: number;
    public updateQueueTimer?: number;

    // tslint:disable-next-line:no-bitwise
    private countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    private changeSubscription: Subscription;

    constructor(private skillQueueService: SkillQueueService, private skillsService: SkillsService, private namesService: NamesService) {
        this.changeSubscription = CharacterService.characterChangeEvent.subscribe(() => {
            this.ngOnInit().then();
        });
    }

    public async ngOnInit() {
        await Promise.all([this.getSkillQueue(), this.getSkills()]);
        this.parseSkillQueue();
    }

    public parseSkillQueue() {

        this.resetTimers();
        this.totalQueueTime = Date.now();
        this.skillTrainingPaused = true;

        if (this.skills) {
            this.skillPoints = this.skills.total_sp;
            this.skills.unallocated_sp = 500000;
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
                    const spGained = (this.spPerSec * (timeExpired / 1000));
                    skillInQueue.spLeft = skillInQueue.spLeft - spGained;

                    this.skillPoints += (this.spPerSec * (timeExpired / 1000));
                    skillInQueue.spAtEnd = this.skillPoints + skillInQueue.spLeft;

                    // Update spPerSec and skill time countdown every second.
                    this.skillQueueTimer = Helpers.repeat(() => {
                        this.skillPoints += this.spPerSec;
                        if (skillInQueue.spLeft) {
                            skillInQueue.spLeft = skillInQueue.spLeft -= this.spPerSec;
                        }
                        skillInQueue.countdown = countdown(Date.now(), skillFinishDate, this.countdownUnits);
                    }, 1000);

                    // Update the list when a skill finishes training.
                    this.updateQueueTimer = setTimeout(() => {
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

    public ngOnDestroy() {
        this.changeSubscription.unsubscribe();
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
}
