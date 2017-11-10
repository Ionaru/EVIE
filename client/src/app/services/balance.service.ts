import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Logger } from 'angular2-logger/core';

import { Character } from '../models/character/character.model';
import { EndpointService } from '../models/endpoint/endpoint.service';

@Injectable()
export class BalanceService {

  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  public async getBalance(character: Character): Promise<number> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'wallet');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers}).toPromise().catch((errorResponse: Response) => errorResponse);

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return -1;
      }

      const walletData = response.text();

      if (isNaN(Number(walletData)) || !walletData.length) {
        this.logger.error('Data did not contain expected values', walletData);
        return -1;
      }

      return Number(walletData);

    } catch (error) {
      this.logger.error(error);
      return -1;
    }
  }
}
