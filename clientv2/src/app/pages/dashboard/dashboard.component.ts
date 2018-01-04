import { Component, OnInit } from '@angular/core';
import { UserService } from '../../models/user/user.service';
import { Character } from '../../models/character/character.model';
import { CharacterService } from '../../models/character/character.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

    public characters: Character[] = [];
    public selectedCharacter = CharacterService.selectedCharacter;
    public deleteInProgress = false;

    constructor(private userService: UserService, private characterService: CharacterService) { }

    ngOnInit() {
        this.characters = UserService.user.characters;
        CharacterService.characterChangeEvent.subscribe(() => {
            this.characters = UserService.user.characters;
            this.selectedCharacter = CharacterService.selectedCharacter;
        });
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
