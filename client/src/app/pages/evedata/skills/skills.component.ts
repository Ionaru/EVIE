import { Component, OnInit } from '@angular/core';
import { SkillData, SkillsService } from '../../../services/skills.service';
import { Globals } from '../../../shared/globals';
import { EndpointService } from '../../../models/endpoint/endpoint.service';
import * as countdown from 'countdown';
import { setInterval } from 'timers';
import { SkillQueueData, SkillQueueService } from '../../../services/skill-queue.service';

@Component({
  templateUrl: 'skills.component.html',
  styleUrls: ['skills.component.scss'],
  providers: [SkillsService, SkillQueueService],
})
export class SkillsComponent implements OnInit {

  skillsData: SkillData;
  skillPoints: number;
  skillQueueData: Array<SkillQueueData>;
  loadingDone = false;
  skillQueueCount = 0;
  skillsCount = 0;
  spPerSec: number;
  skillTrainingPaused = true;

  constructor(private skillsService: SkillsService, private skillQueueService: SkillQueueService,
              private globals: Globals, private endpointService: EndpointService) { }

  async ngOnInit(): Promise<void> {
    this.skillsData = await this.skillsService.getSkills(this.globals.selectedCharacter);
    this.skillQueueData = await this.skillQueueService.getSkillQueue(this.globals.selectedCharacter);

    if (this.skillsData && this.skillQueueData) {

      this.skillPoints = this.skillsData.total_sp;

      if (this.skillsData) {
        const names = [];
        for (const skill of this.skillsData.skills) {
          names.push(skill.skill_id);
        }

        const namesData = await this.endpointService.getNames(...names);

        for (const skill of this.skillsData.skills) {
          skill.name = this.endpointService.getNameFromNameData(namesData, skill.skill_id);
        }

        for (const skill of this.skillQueueData) {

          skill.name = this.endpointService.getNameFromNameData(namesData, skill.skill_id);
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
            this.skillPoints += this.spPerSec * (timeExpired / 1000);
            skill.countdown = countdown(now, skill.finishTimestamp);

            setInterval(() => {
              this.skillPoints += this.spPerSec;
              skill.countdown = countdown(Date.now(), skill.finishTimestamp);
            }, 1000);

          } else {
            // The skill is neither started nor finished, it must be scheduled to start in the future.
            skill.status = 'scheduled';

            if (skill.startTimestamp && skill.finishTimestamp) {
              skill.countdown = countdown(skill.startTimestamp, skill.finishTimestamp);
            }
          }
        }

        this.skillQueueCount = this.skillQueueData.filter(_ => _.status !== 'finished').length;
        this.skillsCount = this.skillsData.skills.length;
        this.loadingDone = true;
      }
    }
  }

  private countLvl5Skills(): number {
    const lvl5Skills = this.skillsData.skills.filter(_ => _.current_skill_level === 5);
    return lvl5Skills.length;
  }
}
