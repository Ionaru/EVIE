import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Logger } from 'angular2-logger/core';
import { Character } from '../models/character/character.model';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Helpers } from '../shared/helpers';

export interface ISkillQueueData {
  start_date: string;
  finish_date: string;

  skill_id: number;
  finished_level: number;
  queue_position: number;

  training_start_sp: number;
  level_start_sp: number;
  level_end_sp: number;

  // Custom attributes, these are added during processing
  name?: string;
  finishTimestamp?: number;
  startTimestamp?: number;
  countdown?: countdown.Timespan | number;
  status?: string;
}

@Injectable()
export class SkillQueueService {
  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  public async getSkillQueue(character: Character): Promise<ISkillQueueData[]> {
    const url = this.endpointService.constructESIUrl('v2/characters', character.characterId, 'skillqueue');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return null;
      }

      const skillQueue: ISkillQueueData[] = response.json();

      if (Helpers.isEmpty(skillQueue)) {
        this.logger.error('Data did not contain expected values', skillQueue);
        return null;
      }

      return skillQueue;

    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }
}
