import { Component, OnDestroy, OnInit } from '@angular/core';
import { ICharacterBlueprintsDataUnit } from '@ionaru/eve-utils';
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

    // tslint:disable-next-line:cognitive-complexity
    public async getBlueprints() {
        if (CharacterService.selectedCharacter) {
            const character = CharacterService.selectedCharacter;

            const res = await this.blueprintsService.getBlueprints(character);

            const assets = await this.assetsService.getAssets(character);

            const types = res.map((blueprint) => blueprint.type_id);
            this.namesService.getNames(...types).then();

            this.blueprints = res;

            for (const result of this.blueprints) {
                const blueprint = assets.find((asset) => asset.item_id === result.item_id);
                if (blueprint) {

                    const container = assets.find((asset) => asset.item_id === blueprint.location_id);
                    if (container) {

                        await this.namesService.getNames(container.location_id);
                        result.location_name = NamesService.getNameFromData(container.location_id);

                    } else if (blueprint.location_flag === 'Hangar') {

                        let structureInfo;

                        if (blueprint.location_id > Calc.maxIntegerValue) {
                            structureInfo = await this.structuresService.getStructureInfo(character, blueprint.location_id);
                        }

                        let locationName;

                        if (structureInfo) {
                            locationName = structureInfo.name;
                        } else {
                            await this.namesService.getNames(blueprint.location_id);
                            locationName = NamesService.getNameFromData(blueprint.location_id);
                        }

                        result.location_name = locationName;
                    }

                }
            }
        }
    }

    public getName(id: number) {
        return NamesService.getNameFromData(id);
    }
}
