import { Component, OnInit } from '@angular/core';

import { INames, NamesService } from '../../data-services/names.service';
import { ShipService } from '../../data-services/ship.service';
import { Character } from '../../models/character/character.model';
import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

    public characters: Character[] = [];
    public selectedCharacter = CharacterService.selectedCharacter;
    public deleteInProgress = false;

    constructor(private userService: UserService, private characterService: CharacterService, private shipService: ShipService,
                private namesService: NamesService) { }

    ngOnInit() {
        this.characters = UserService.user.characters;
        CharacterService.characterChangeEvent.subscribe(() => {
            this.characters = UserService.user.characters;
            this.selectedCharacter = CharacterService.selectedCharacter;
            this.getCharacterInfo(this.selectedCharacter);
        });
        for (const character of this.characters) {
            this.getCharacterInfo(character);
        }
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
        const nameData: INames = await this.namesService.getNames(character.currentShip.id);
        // character.location.name = NamesService.getNameFromData(nameData, character.location.id, 'Unknown location');
        character.currentShip.type = NamesService.getNameFromData(nameData, character.currentShip.id, 'Unknown ship');
    }

    public isCharacterSelected(character: Character): boolean {
        return character === this.selectedCharacter;
    }

    public getActivateButtonClass(character: Character) {
        if (this.isCharacterSelected(character)) {
            return 'btn-success';
        }
        return 'btn-outline-success';
    }
}
