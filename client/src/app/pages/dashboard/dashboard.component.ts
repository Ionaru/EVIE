import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';
import { CharacterService } from '../../components/character/character.service';
import { Character } from '../../components/character/character';
import { ShipService } from './ship.service';
import { LocationService } from './location.service';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  providers: [CharacterService, ShipService, LocationService]
})
export class DashboardComponent implements OnInit {
  result: String;
  username: string;
  characters: Array<Character>;
  selectedCharacter: Character;

  constructor(private title: Title,
              private globals: Globals,
              private characterService: CharacterService,
              private shipService: ShipService,
              private locationService: LocationService) {
    this.globals.characterChangeEvent.subscribe(() => {
      if (this.globals.startUp) {
        this.displayCharacters();
      }
    });
  }

  ngOnInit(): void {
    this.title.setTitle('EVE Track - Dashboard');
    this.username = this.globals.user.username;
    this.displayCharacters();
  }

  displayCharacters(): void {
    this.selectedCharacter = this.globals.selectedCharacter;
    this.characters = this.globals.user.characters;
    if (this.characters) {
      for (const character of this.characters) {
        this.shipService.getCurrentShip(character).first().subscribe((data) => {
          data.first().subscribe((shipData) => {
            character.currentShip = {
              shipName: shipData['name'],
              shipType: shipData['ship']
            };
          });
        });
        this.locationService.getLocation(character).first().subscribe((locationData) => {
          locationData.first().subscribe((locationName) => {
            character.location = locationName;
          });
        });
      }
    }
  }

  isActive(character: Character): boolean {
    if (!this.selectedCharacter) {
      return false;
    }
    return this.selectedCharacter.pid === character.pid;
  }

  setActiveCharacter(character: Character): void {
    this.characterService.setActiveCharacter(character);
  }

  startSSO(): void {
    this.characterService.startAuthProcess();
  }

  reAuth(character: Character): void {
    this.characterService.startAuthProcess(character);
  }

  deleteCharacter(character: Character): void {
    this.characterService.deleteCharacter(character);
  }
}
