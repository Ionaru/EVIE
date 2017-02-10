import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';
import { CharacterService } from '../../components/character/character.service';
import { Character } from '../../components/character/character';
import { ShipService } from './ship.service';
import { LocationService } from './location.service';
import { EndpointService } from '../../components/endpoint/endpoint.service';

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
              private endpointService: EndpointService,
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
        this.shipService.getCurrentShip(character).first().subscribe((shipData) => {
          character.currentShip = {
            id: shipData.id,
            name: shipData.name,
            type: null,
          };
          this.locationService.getLocation(character).first().subscribe((locationID) => {
            // character.location.id = locationID;
            character.location = {
              id: locationID,
              name: null,
            };
            this.endpointService.getNames(character.location.id, character.currentShip.id).first().subscribe((nameData) => {
              character.location.name = nameData.filter(_ => _.id === character.location.id)[0]['name'];
              character.currentShip.type = nameData.filter(_ => _.id === character.currentShip.id)[0]['name'];
            });
          });
        });
      }
    }
  }

  getCharacterData(character: Character): void {
    this.characterService.getCharacterData(character).subscribe();
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
