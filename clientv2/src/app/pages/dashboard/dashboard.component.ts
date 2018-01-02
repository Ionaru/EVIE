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

    constructor(private userService: UserService, private characterService: CharacterService) { }

    ngOnInit() {
        // UserService.userChangeEvent.subscribe(() => {
        this.characters = UserService.user.characters;
        // });
    }

    private switchToCharacter(character: Character) {
        this.characterService.setActiveCharacter(character).then();
    }
}
