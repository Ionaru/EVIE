import { Component, OnDestroy, OnInit } from '@angular/core';
import { ICharacterAssetsData, ICharacterBlueprintsDataUnit } from '@ionaru/eve-utils';

import { Calc } from '../../../shared/calc.helper';
import { AssetsService } from '../../data-services/assets.service';
import { BlueprintsService } from '../../data-services/blueprints.service';
import { NamesService } from '../../data-services/names.service';
import { StructuresService } from '../../data-services/structures.service';
import { CharacterService } from '../../models/character/character.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';

interface IExtendedCharacterBlueprintsDataUnit extends ICharacterBlueprintsDataUnit {
    location_name?: string;
}

@Component({
    selector: 'app-assets',
    styleUrls: ['./assets.component.scss'],
    templateUrl: './assets.component.html',
})
export class AssetsComponent extends DataPageComponent implements OnInit, OnDestroy {

    public blueprints?: IExtendedCharacterBlueprintsDataUnit[];

    constructor(
        private assetsService: AssetsService,
        private blueprintsService: BlueprintsService,
        private namesService: NamesService,
        private structuresService: StructuresService,
    ) {
        super();
        this.requiredScopes = [ScopesComponent.scopeCodes.ASSETS, ScopesComponent.scopeCodes.STRUCTURES];
    }

    public ngOnInit() {
        super.ngOnInit();
        this.getBlueprints().then();
    }

    public async ngOnDestroy() {
        super.ngOnDestroy();
    }

    public async getBlueprints() {
        if (CharacterService.selectedCharacter) {
            const character = CharacterService.selectedCharacter;

            const [blueprints, assets] = await Promise.all([
                this.blueprintsService.getBlueprints(character),
                this.assetsService.getAssets(character),
            ]);

            const types = blueprints.map((blueprint) => blueprint.type_id);
            this.namesService.getNames(...types).then();

            (blueprints as IExtendedCharacterBlueprintsDataUnit[]).forEach((async (blueprint) => {
                blueprint.location_name = await this.getBlueprintLocation(blueprint, assets);
            }));

            this.blueprints = blueprints;
        }
    }

    public getName(id: number) {
        return NamesService.getNameFromData(id);
    }

    private async getBlueprintLocation(blueprint: ICharacterBlueprintsDataUnit, assets: ICharacterAssetsData): Promise<string> {
        const container = assets.find((asset) => asset.item_id === blueprint.location_id);
        if (container) {
            // Blueprint is in a container.

            await this.namesService.getNames(container.location_id);
            return NamesService.getNameFromData(container.location_id);

        } else if (blueprint.location_flag === 'Hangar') {
            // Blueprint is in a hangar somewhere.

            if (blueprint.location_id > Calc.maxIntegerValue && CharacterService.selectedCharacter) {
                const character = CharacterService.selectedCharacter;
                const structureInfo = await this.structuresService.getStructureInfo(character, blueprint.location_id);
                if (structureInfo) {
                    return structureInfo.name;
                }
            }

            await this.namesService.getNames(blueprint.location_id);
            return NamesService.getNameFromData(blueprint.location_id);
        }

        return 'Unknown location';
    }
}