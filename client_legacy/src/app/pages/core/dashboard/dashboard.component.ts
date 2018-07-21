import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { Character } from '../../../models/character/character.model';
import { CharacterService } from '../../../models/character/character.service';
import { LocationService } from '../../../services/location.service';
import { INames, NamesService } from '../../../services/names.service';
import { ShipService } from '../../../services/ship.service';
import { Globals } from '../../../shared/globals';

@Component({
  providers: [ShipService, LocationService],
  styleUrls: ['dashboard.component.scss'],
  templateUrl: 'dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public result: string;
  public username: string;
  public characters: Character[];
  public selectedCharacter: Character;
  public characterChangeSubscription: Subscription;

  constructor(private title: Title,
              private globals: Globals,
              private namesService: NamesService,
              private characterService: CharacterService,
              private shipService: ShipService,
              private locationService: LocationService) {
  }

  public ngOnInit(): void {
    this.characterChangeSubscription = this.globals.characterChangeEvent.subscribe(() => {
      if (this.globals.startUp) {
        this.displayCharacters();
      }
    });
    this.title.setTitle('EVE Track - Dashboard');
    this.username = this.globals.user.username;
    this.displayCharacters();
  }

  public ngOnDestroy(): void {
    this.characterChangeSubscription.unsubscribe();
  }

  public displayCharacters(): void {
    this.selectedCharacter = this.globals.selectedCharacter;
    this.characters = this.globals.user.characters;
    if (this.characters) {
      for (const character of this.characters) {
        this.getAllData(character).then();
      }
    }
  }

  public async getAllData(character: Character): Promise<void> {
    await this.getCharacterData(character);
    await this.getLocationData(character);
    await this.getShipData(character);
    const nameData: INames = await this.namesService.getNames(character.location.id, character.currentShip.id);
    character.location.name = NamesService.getNameFromData(nameData, character.location.id, 'Unknown location');
    character.currentShip.type = NamesService.getNameFromData(nameData, character.currentShip.id, 'Unknown ship');
  }

  public async getLocationData(character: Character): Promise<void> {
    character.location.id = await this.locationService.getLocation(character);
  }

  public async getShipData(character: Character): Promise<void> {
    const shipData: { id: number, name: string } = await this.shipService.getCurrentShip(character);
    character.currentShip.id = shipData.id;
    character.currentShip.name = shipData.name;
  }

  public async refreshLocation(character: Character): Promise<void> {
    character.location = {};

    await this.getLocationData(character);
    const nameData: INames = await this.namesService.getNames(character.location.id);
    character.location.name = NamesService.getNameFromData(nameData, character.location.id, 'Unknown location');
  }

  public async refreshShip(character: Character): Promise<void> {
    character.currentShip = {};

    await this.getShipData(character);
    const nameData: INames = await this.namesService.getNames(character.currentShip.id);
    character.currentShip.type = NamesService.getNameFromData(nameData, character.currentShip.id, 'Unknown ship');
  }

  public async getCharacterData(character: Character): Promise<void> {
    await this.characterService.getPublicCharacterData(character);
  }

  public isActive(character: Character): boolean {
    if (!this.selectedCharacter) {
      return false;
    }
    return this.selectedcharacter.uuid === character.uuid;
  }

  public setActiveCharacter(character: Character): void {
    this.characterService.setActiveCharacter(character).then();
  }

  public startSSO(): void {
    this.characterService.startAuthProcess();
  }

  public reAuth(character: Character): void {
    this.characterService.startAuthProcess(character);
  }

  public deleteCharacter(character: Character): void {
    this.characterService.deleteCharacter(character);
  }
}
