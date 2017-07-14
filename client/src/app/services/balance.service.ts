import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { EndpointService } from '../models/endpoint/endpoint.service';
import { Logger } from 'angular2-logger/core';
import { Character } from '../models/character/character.model';
import { Helpers } from '../shared/helpers';

interface BalanceData {
  balance: number;
  wallet_id: number;
}

@Injectable()
export class BalanceService {

  constructor(private logger: Logger, private http: Http, private endpointService: EndpointService) { }

  async getBalance(character: Character): Promise<number> {
    const url = this.endpointService.constructESIUrl('v1/characters', character.characterId, 'wallets');
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + character.accessToken);
    let response: Response;
    try {

      response = await this.http.get(url, {headers: headers}).toPromise().catch((error) => {
        throw new Error(error);
      });

      if (!response.ok || response.status !== 200) {
        this.logger.error('Response was not OK', response);
        return -1;
      }

      const walletData: Array<BalanceData> = response.json();

      if (Helpers.isEmpty(walletData)) {
        this.logger.error('Data did not contain expected values', walletData);
        return -1;
      }

      const walletMaster = walletData.filter(_ => _.wallet_id === 1000)[0];

      if (!walletMaster) {
        this.logger.error('Data did not contain master wallet', walletData);
        return -1;
      }

      // Balance data is returned in hundredths of ISK, divide by 100 to compensate.
      return walletMaster.balance / 100;

    } catch (err) {
      this.logger.error(err);
      return -1;
    }
  }
}
