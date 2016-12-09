import { Injectable } from '@angular/core';
import { Account } from './account';
import { Observable } from 'rxjs';
import { Http, Headers, Response } from '@angular/http';
import { processXML } from '../helperfunctions.component';
import { Character } from '../character/character';
import { EndpointService } from '../endpoint/endpoint.service';

@Injectable()
export class AccountService {

  constructor(private http: Http, private es: EndpointService) { }

  public getAccountData(account: Account): Observable<Account> {

    let url: string = this.es.constructUrl(this.es.getEndpoint('APIKeyInfo'));
    let headers: Headers = new Headers();
    headers.append('Accept', 'application/xml');
    return this.http.get(url, {
      headers: headers
    }).map((res: Response) => {
      let data: Object = processXML(res)['eveapi'];
      account.accessMask = data['result']['key']['@attributes']['accessMask'];
      let characters: Array<Object> = data['result']['key']['rowset']['row'];
      account.characters = [];
      for (let character of characters) {
        let character_id: number = character['@attributes']['characterID'];
        let character_name: string = character['@attributes']['characterName'];
        account.characters.push(new Character(character_id, character_name));
      }
      return account;
    });
  }
}
