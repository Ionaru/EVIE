import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EVE, IUniverseStructureData } from '@ionaru/eve-utils';

import { Character } from '../models/character/character.model';
import { Scope } from '../pages/scopes/scopes.component';
import { BaseService } from './base.service';

interface IStructureCache {
    [key: number]: IUniverseStructureData | undefined;
}

@Injectable()
export class StructuresService extends BaseService {

    private structureCache: IStructureCache = {}

    public async getStructureInfo(character: Character, structureId: number): Promise<IUniverseStructureData | void> {
        BaseService.confirmRequiredScope(character, Scope.STRUCTURES, 'getStructureInfo');

        if (structureId in this.structureCache) {
            return this.structureCache[structureId];
        }

        const url = EVE.getUniverseStructureUrl(structureId);
        const headers = new HttpHeaders({Authorization: character.getAuthorizationHeader()});
        const response = await this.http.get<any>(url, {headers}).toPromise<IUniverseStructureData>().catch(this.catchHandler);
        if (response instanceof HttpErrorResponse) {
            this.structureCache[structureId] = undefined;
            return;
        }
        this.structureCache[structureId] = response;
        return response;
    }
}
