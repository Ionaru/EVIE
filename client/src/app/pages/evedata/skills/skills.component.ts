import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as countdown from 'countdown';
import Timer = NodeJS.Timer;
import Timespan = countdown.Timespan;

import { NamesService } from '../../../services/names.service';
import { ISkillGroupData, SkillGroupsService } from '../../../services/skill-groups.service';
import { ISkillQueueData, SkillQueueService } from '../../../services/skill-queue.service';
import { ISkill, ISkillData, SkillsService } from '../../../services/skills.service';
import { Globals } from '../../../shared/globals';
import { Helpers } from '../../../shared/helpers';

@Component({
  providers: [SkillsService, SkillQueueService, SkillGroupsService],
  styleUrls: ['skills.component.scss'],
  templateUrl: 'skills.component.html',
})
export class SkillsComponent implements OnInit, OnDestroy {

  public skillsData: ISkillData;
  public skillPoints: number;
  public skillQueueData: ISkillQueueData[];
  public loadingDone = false;
  public skillQueueCount: number;
  public skillQueueTimeLeft: number;
  public skillsCount: number;
  public spPerSec: number;
  public skillTrainingPaused = true;
  public totalQueueCountdown: number | Timespan;
  public totalQueueTime: number;
  public totalQueueTimer: Timer;
  public skillQueueTimer: Timer;
  public refreshOnComplete: Timer;
  public skillGroups: ISkillGroupData[];
  public skillList: {
    [groupId: number]: ISkill[],
  } = {};

  constructor(private skillsService: SkillsService, private skillQueueService: SkillQueueService, private helpers: Helpers,
              private skillGroupsService: SkillGroupsService, private globals: Globals, private namesService: NamesService,
              private title: Title) {
    title.setTitle(Helpers.createTitle('Skills'));
  }

  public async ngOnInit(): Promise<void> {

    await Promise.all([this.setSkills(), this.setSkillQueue(), this.setSkillGroups()]);

    this.skillQueueCount = 0;
    this.skillsCount = 0;
    this.totalQueueTime = Date.now();

    if (this.skillsData && this.skillQueueData) {

      this.skillPoints = this.skillsData.total_sp;

      if (this.skillsData) {
        const names = [];
        for (const skill of this.skillsData.skills) {
          names.push(skill.skill_id);
        }

        const namesData = await this.namesService.getNames(...names);

        for (const skill of this.skillsData.skills) {
          skill.name = NamesService.getNameFromData(namesData, skill.skill_id, 'Unknown skill');
        }

        for (const group of this.skillGroups) {
          this.skillList[group.group_id] = this.getSkillsForGroup(group);
        }

        for (const skill of this.skillQueueData) {

          skill.name = NamesService.getNameFromData(namesData, skill.skill_id, 'Unknown skill');
          skill.finishTimestamp = new Date(skill.finish_date).getTime();
          skill.startTimestamp = new Date(skill.start_date).getTime();
          const now = Date.now();
          const skillPointsGain = skill.level_end_sp - skill.training_start_sp;

          if (skill.finishTimestamp < now) {
            // This skills finished training somewhere in the past
            skill.status = 'finished';

            this.skillsData.skillsObject[skill.skill_id].current_skill_level++;
            this.skillPoints += skillPointsGain;

          } else if (skill.startTimestamp < now) {
            // This skill was started somewhere in the past, and because the above statement failed, we can assume it's not finished yet.
            skill.status = 'training';
            this.skillTrainingPaused = false;

            const skillTrainingTime = skill.finishTimestamp - skill.startTimestamp;
            this.spPerSec = skillPointsGain / (skillTrainingTime / 1000);
            const timeLeft = skill.finishTimestamp - now;
            const timeExpired = skillTrainingTime - timeLeft;
            this.skillPoints += (this.spPerSec * (timeExpired / 1000));
            this.totalQueueTime += timeLeft;

            this.skillQueueTimer = Helpers.repeat(() => {
              this.skillPoints += this.spPerSec;
              skill.countdown = countdown(Date.now(), skill.finishTimestamp);
            }, 1000);

            // Refresh the page 1 second after the skill finished training, to fetch and parse the new data.
            this.refreshOnComplete = setTimeout(() => {
              this.refreshPage();
            }, timeLeft + 1000);

          } else {
            // The skill is neither started nor finished, it must be scheduled to start in the future.
            skill.status = 'scheduled';

            if (skill.startTimestamp && skill.finishTimestamp) {
              skill.countdown = countdown(skill.startTimestamp, skill.finishTimestamp);
              this.totalQueueTime += (skill.finishTimestamp - skill.startTimestamp);
            }
          }
        }

        this.skillQueueCount = this.skillQueueData.filter((_) => _.status !== 'finished').length;
        this.skillsCount = this.skillsData.skills.length;
        this.loadingDone = true;
      }
    }

    this.totalQueueTimer = Helpers.repeat(() => {
      this.totalQueueCountdown = countdown(Date.now(), this.totalQueueTime);
      this.skillQueueTimeLeft = this.totalQueueTime - Date.now();
    }, 1000);
  }

  // noinspection JSMethodCanBeStatic
  public toggleAccordion(event) {
    let acc: HTMLElement = event.target;

    if (!acc.classList.contains('accordion')) {
      if (acc.parentElement.classList.contains('accordion')) {
        acc = acc.parentElement;
      }
    }

    acc.classList.toggle('active');
    const panel = acc.nextElementSibling as HTMLElement;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }

  public ngOnDestroy() {
    clearInterval(this.totalQueueTimer);
    clearInterval(this.skillQueueTimer);
    clearTimeout(this.refreshOnComplete);
  }

  public skillQueueLow() {
    return !this.skillTrainingPaused && this.skillQueueTimeLeft < (24 * 60 * 60 * 1000);
  }

  public countLvl5Skills(): number {
    return this.skillsData.skills.filter((_) => _.current_skill_level === 5).length;
  }

  public getSkillGroup(skillId) {
    return this.skillGroups.filter((_) => _.types.indexOf(skillId) !== -1)[0].name;
  }

  public getSkillsForGroup(group: ISkillGroupData) {
    let skills = this.skillsData.skills.filter((_) => group.types.indexOf(_.skill_id) !== -1);
    skills = this.helpers.sortArrayByObjectProperty(skills, 'name');
    return skills;
  }

  public refreshPage() {
    this.ngOnDestroy();
    this.ngOnInit().then();
  }

  public getSkillsInGroup(groupId) {
    return this.skillList[groupId];
  }

  private async setSkillGroups() {
    this.skillGroups = await this.skillGroupsService.getSkillGroupInformation();
  }

  private async setSkillQueue() {
    this.skillQueueData = await this.skillQueueService.getSkillQueue(this.globals.selectedCharacter);
  }

  private async setSkills() {
    this.skillsData = await this.skillsService.getSkills(this.globals.selectedCharacter);
  }
}
