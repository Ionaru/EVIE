import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { INames, NamesService } from '../../data-services/names.service';
import { ShipService } from '../../data-services/ship.service';
import { Character } from '../../models/character/character.model';
import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';

@Component({
    selector: 'app-dashboard',
    styleUrls: ['./dashboard.component.scss'],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {

    public characters: Character[] = [];
    public deleteInProgress = false;
    private changeSubscription: Subscription;

    constructor(private userService: UserService, private characterService: CharacterService, private shipService: ShipService,
                private namesService: NamesService) {
        this.changeSubscription = CharacterService.characterChangeEvent.subscribe(() => {
            this.ngOnInit();
        });
    }

    public ngOnInit() {
        this.characters = UserService.user.characters;
        for (const character of this.characters) {
            this.getCharacterInfo(character);
        }
    }

    public ngOnDestroy() {
        this.changeSubscription.unsubscribe();
    }

    public getCharacterInfo(character: Character) {
        this.getShipData(character).then();
    }

    public switchToCharacter(character: Character) {
        this.characterService.setActiveCharacter(character).then();
    }

    public authCharacter(character?: Character) {
        this.userService.authCharacter(character);
    }

    public async deleteCharacter(character: Character) {
        this.deleteInProgress = true;
        await this.userService.deleteCharacter(character);
        this.deleteInProgress = false;
    }

    public async getShipData(character: Character): Promise<void> {
        const shipData: { id: number, name: string } = await this.shipService.getCurrentShip(character);
        character.currentShip.id = shipData.id;
        character.currentShip.name = shipData.name;
        await this.namesService.getNames(character.currentShip.id);
        character.currentShip.type = NamesService.getNameFromData(character.currentShip.id, 'Unknown ship');
    }

    // noinspection JSMethodCanBeStatic
    public isCharacterSelected(character: Character): boolean {
        return character === CharacterService.selectedCharacter;
    }

    public getActivateButtonClass(character: Character) {
        if (this.isCharacterSelected(character)) {
            return 'btn-success';
        }
        return 'btn-outline-success';
    }
}
