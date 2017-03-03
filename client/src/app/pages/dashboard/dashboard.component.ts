import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Globals } from '../../globals';
import { CharacterService } from '../../components/character/character.service';
import { Character } from '../../components/character/character';
import { ShipService } from './ship.service';
import { LocationService } from './location.service';
import { EndpointService, EveNameData } from '../../components/endpoint/endpoint.service';

@Component({
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  providers: [ShipService, LocationService]
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
        this.displayCharacters().then();
      }
    });
  }

  ngOnInit(): void {
    this.title.setTitle('EVE Track - Dashboard');
    this.username = this.globals.user.username;
    this.displayCharacters().then();
  }

  async displayCharacters(): Promise<void> {
    this.selectedCharacter = this.globals.selectedCharacter;
    this.characters = this.globals.user.characters;
    if (this.characters) {
      for (const character of this.characters) {
        this.getAllData(character).then();
      }
    }
  }

  async getAllData(character: Character): Promise<void> {
    await this.getCharacterData(character);
    await this.getLocationData(character);
    await this.getShipData(character);
    const nameData: Array<EveNameData> = await this.endpointService.getNames(character.location.id, character.currentShip.id);
    character.location.name = this.endpointService.getNameFromNameData(nameData, character.location.id);
    character.currentShip.type = this.endpointService.getNameFromNameData(nameData, character.currentShip.id);
  }

  async getLocationData(character: Character): Promise<void> {
    character.location.id = await this.locationService.getLocation(character);
  }

  async getShipData(character: Character): Promise<void> {
    const shipData: { id: number, name: string } = await this.shipService.getCurrentShip(character);
    character.currentShip.id = shipData.id;
    character.currentShip.name = shipData.name;
  }

  async refreshLocation(character: Character): Promise<void> {
    character.location = {};

    await this.getLocationData(character);
    const nameData: Array<EveNameData> = await this.endpointService.getNames(character.location.id);
    character.location.name = this.endpointService.getNameFromNameData(nameData, character.location.id);
  }

  async refreshShip(character: Character): Promise<void> {
    character.currentShip = {};

    await this.getShipData(character);
    const nameData: Array<EveNameData> = await this.endpointService.getNames(character.currentShip.id);
    character.currentShip.type = this.endpointService.getNameFromNameData(nameData, character.currentShip.id);
  }

  async getCharacterData(character: Character): Promise<void> {
    await this.characterService.getPublicCharacterData(character);
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
