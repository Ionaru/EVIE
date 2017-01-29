import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';
import { CharacterService } from '../../components/character/character.service';
import { Character } from '../../components/character/character';
import { ShipService } from './ship.service';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  providers: [CharacterService, ShipService]
})
export class DashboardComponent implements OnInit {
  result: String;
  username: string;
  characters: Array<Character>;
  selectedCharacter;

  constructor(private title: Title,
              private globals: Globals,
              private characterService: CharacterService,
              private shipService: ShipService) {
  }

  ngOnInit(): void {
    this.title.setTitle('EVE Track - Dashboard');
    this.username = this.globals.user.username;
    this.displayCharacters();
    this.globals.characterChangeEvent.subscribe(() => {
      console.log('Triggered');
      this.displayCharacters();
    });
  }

  displayCharacters(): void {
    this.selectedCharacter = this.globals.selectedCharacter;
    this.characters = this.globals.user.characters;
    for (let character of this.globals.user.characters){
      this.shipService.getCurrentShip(character).first().subscribe((data) => {
        data.first().subscribe((shipData) => {
          character.currentShip = {
            shipName: shipData['name'],
            shipType: shipData['ship']
          };
        });
      });
    }
  }

  setActiveCharacter(character: Character): void {
    this.characterService.setActiveCharacter(character);
  }

  startSSO(): void {
    this.characterService.startAuthProcess();
  }

  refreshToken(): void {
    this.characterService.refreshToken(this.globals.selectedCharacter).subscribe();
  }

  reAuth(): void {
    this.characterService.startAuthProcess(this.globals.selectedCharacter);
  }

  dumpCharacter(): void {
    this.characterService.dumpCharacter(this.globals.selectedCharacter);
  };
}
