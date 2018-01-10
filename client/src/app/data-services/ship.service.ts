import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { Character } from '../models/character/character.model';
import { EndpointService } from '../models/endpoint/endpoint.service';

export interface IShipData {
    ship_item_id: number;
    ship_name: string;
    ship_type_id: number;
}

@Injectable()
export class ShipService {
    constructor(private http: HttpClient, private endpointService: EndpointService) { }

    public async getCurrentShip(character: Character): Promise<{ id, name }> {
        const url = this.endpointService.constructESIUrl(1, 'characters', character.characterId, 'ship');
        const headers = new HttpHeaders({'Authorization': 'Bearer ' + character.accessToken});
        // headers.append('Authorization', 'Bearer ' + character.accessToken);
        // console.log(headers);
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
