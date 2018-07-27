import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Common } from '../../shared/common.helper';
import { EVE } from '../../shared/eve.helper';
import { IShipData } from '../../shared/interface.helper';
import { Character } from '../models/character/character.model';

@Injectable()
export class ShipService {
    constructor(private http: HttpClient) { }

    public async getCurrentShip(character: Character): Promise<{ id: number, name: string }> {
        const url = EVE.constructESIURL(1, 'characters', character.characterId, 'ship');
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<IShipData>().catch(Common.return);
        if (response instanceof HttpErrorResponse) {
            return {id: -1, name: 'Error'};
        }
        return {
            id: response.ship_type_id,
            name: response.ship_name,
        };
    }
}
