import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterMailsData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { Scope } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class MailService extends BaseService {

    public async getMails(character: Character): Promise<ICharacterMailsData | undefined> {
        BaseService.confirmRequiredScope(character, Scope.MAIL_READ, 'getMails');

        const url = EVE.getCharacterMailsUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterMailsData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return;
        }
        return response;
    }

    // public async getMail(character: Character, mailId: number) {}
    // public async sendMail(character: Character, mailId: number) {}
}
