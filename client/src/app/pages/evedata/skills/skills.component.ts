import { Component, OnInit } from '@angular/core';
import { SkillData, SkillQueueData, SkillService } from '../../../services/skills.service';
import { Globals } from '../../../shared/globals';
import { EndpointService } from '../../../models/endpoint/endpoint.service';
import { Helpers } from '../../../shared/helpers';

@Component({
  templateUrl: 'skills.component.html',
  styleUrls: ['skills.component.scss'],
  providers: [SkillService],
})
export class SkillsComponent implements OnInit {

  skillsData: SkillData;
  skillQueueData: Array<SkillQueueData>;
  loadingDone = false;

  constructor(private skillService: SkillService, private globals: Globals, private endpointService: EndpointService,
              private helpers: Helpers) { }

  async ngOnInit(): Promise<void> {
    this.skillsData = await this.skillService.getSkills(this.globals.selectedCharacter);
    this.skillQueueData = await this.skillService.getSkillQueue(this.globals.selectedCharacter);
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
    }
    this.loadingDone = true;
  }

  countLvl5Skills(): number {
    const lvl5Skills = this.skillsData.skills.filter(_ => _.current_skill_level === 5);
    return lvl5Skills.length;
  }
}
