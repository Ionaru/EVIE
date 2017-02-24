import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';
import { CharacterService } from '../../components/character/character.service';
import { Character } from '../../components/character/character';
import { ShipService } from './ship.service';
import { LocationService } from './location.service';
import { EndpointService, EveNameData } from '../../components/endpoint/endpoint.service';
import { Observable } from 'rxjs';

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
        this.getAllData(character);
        this.getCharacterData(character);
      }
    }
  }

  getAllData(character: Character) {
    this.getShipData(character).first().subscribe(() => {
      this.getLocationData(character).first().subscribe(() => {
        this.endpointService.getNames(character.location.id, character.currentShip.id).first().subscribe((nameData: Array<EveNameData>) => {
          character.location.name = nameData.filter(_ => _.id === character.location.id)[0].name || 'Error';
          character.currentShip.type = nameData.filter(_ => _.id === character.currentShip.id)[0].name || 'Error';
        });
      });
    });
  }

  getLocationData(character: Character): Observable<void> {
    return this.locationService.getLocation(character).map((locationID: number) => {
      if (locationID === -1) {
        character.location.id = -1;
      }
      character.location.id = locationID;
    });
  }

  getShipData(character: Character): Observable<void> {
    return this.shipService.getCurrentShip(character).map((shipData: {id: number, name: string}) => {
      character.currentShip.id = shipData.id;
      character.currentShip.name = shipData.name;
    });
  }

  refreshLocation(character: Character): void {
    character.location = {};
    this.getLocationData(character).first().subscribe(() => {
      this.endpointService.getNames(character.location.id).first().subscribe((nameData: Array<EveNameData>) => {
        character.location.name = nameData.filter(_ => _.id === character.location.id)[0].name || 'Error';
      });
    });
  }

  refreshShip(character: Character): void {
    character.currentShip = {};

    this.getShipData(character).first().subscribe(() => {
      this.endpointService.getNames(character.location.id).first().subscribe((nameData: Array<EveNameData>) => {
        try {
          character.currentShip.type = nameData.filter(_ => _.id === character.currentShip.id)[0].name || 'Error';
        } catch (err) {
          console.error(err);
          character.currentShip.type = 'Error';
        }
      });
    });
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
