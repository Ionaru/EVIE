import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, ICharacterShipData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { Scope } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

@Injectable()
export class ShipService extends BaseService {

    public async getCurrentShip(character: Character): Promise<{ id: number, name: string }> {
        BaseService.confirmRequiredScope(character, Scope.SHIP_TYPE, 'getCurrentShip');

        const url = EVE.getCharacterShipUrl(character.characterId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<ICharacterShipData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            return {id: -1, name: 'Error'};
        }
        return {
            id: response.ship_type_id,
            name: response.ship_name,
        };
    }
}
