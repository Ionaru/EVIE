import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Character } from '../models/character/character.model';
import { Helpers } from '../shared/helpers';

export interface IShipData {
    ship_item_id: number;
    ship_name: string;
    ship_type_id: number;
}

@Injectable()
export class ShipService {
    constructor(private http: HttpClient) { }

    public async getCurrentShip(character: Character): Promise<{ id: number, name: string }> {
        const url = Helpers.constructESIURL(1, 'characters', character.characterId, 'ship');
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<IShipData>().catch((e: HttpErrorResponse) => e);
        if (response instanceof HttpErrorResponse) {
            return {id: -1, name: 'Error'};
        }
        return {
            id: response.ship_type_id,
            name: response.ship_name,
        };
    }
}
