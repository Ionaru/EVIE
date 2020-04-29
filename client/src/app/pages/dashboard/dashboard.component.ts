import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { faCheck, faSync, faTrash, faUserPlus } from '@fortawesome/pro-regular-svg-icons';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { romanize } from '@ionaru/romanize';
import * as countdown from 'countdown';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { Calc } from '../../../shared/calc.helper';
import { NamesService } from '../../data-services/names.service';
import { ShipService } from '../../data-services/ship.service';
import { SkillQueueService } from '../../data-services/skillqueue.service';
import { WalletService } from '../../data-services/wallet.service';
import { Character } from '../../models/character/character.model';
import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { Scope } from '../scopes/scopes.component';
import { SkillsComponent } from '../skills/skills.component';
import { createTitle } from '../../shared/title';

type sortOption = 'name' | 'birthday' | 'skillqueue' | 'ISK';
type sortProperties = 'name' | 'birthday' | 'totalTrainingFinish' | 'balance';

@Component({
    selector: 'app-dashboard',
    styleUrls: ['./dashboard.component.scss'],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent extends DataPageComponent implements OnInit, OnDestroy {

    public faUserPlus = faUserPlus;
    public faCheck = faCheck;
    public faSync = faSync;
    public faTrash = faTrash;

    public characters: Character[] = [];
    public charactersFiltered: Character[] = [];
    public characterNames?: (text: Observable<string>) => Observable<string[]>;
    public characterSearch?: string;
    public deleteInProgress = false;

    public skillQueueInterval?: number;
    public skillQueueTimer?: number;

    public sortOptions: sortOption[] = ['name', 'birthday', 'skillqueue', 'ISK'];
    public sortInverted = false;
    public selectedSortOption: sortOption;

    // tslint:disable-next-line:no-bitwise
    private readonly countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    private static adjustCountDownForDST(finish: Date, cd: number | countdown.Timespan) {
        if (typeof cd !== 'number') {
            const timeLeft = finish.getTime() - Date.now();
            SkillsComponent.adjustCountDownForDST(cd, timeLeft);
        }
    }

    constructor(private userService: UserService, private characterService: CharacterService, private shipService: ShipService,
                private namesService: NamesService, private skillQueueService: SkillQueueService, private router: Router,
                private walletService: WalletService, private title: Title) {
        super();

        this.selectedSortOption = localStorage.getItem('DashboardSorting') as sortOption || this.sortOptions[0];
        this.sortInverted = localStorage.getItem('DashboardSortingInverted') === 'true';

        countdown.setLabels(
            '|s|m|h|d',
            '|s|m|h|d',
            ', ');
    }

    // tslint:disable-next-line:cognitive-complexity
    public async ngOnInit() {
        super.ngOnInit();
        this.title.setTitle(createTitle('Dashboard'));
        this.characters = this.charactersFiltered = UserService.user.characters;
        const names = this.characters.map((character) => character.name);

        this.characterNames = (text$: Observable<string>) => {
            return text$.pipe(
                debounceTime(200),
                distinctUntilChanged(),
                // When more than 2 letters are types
                map((term: string) => term.length < 2 ? [] : names.filter(
                    // Returns max 10 names
                    (name) => name.toLowerCase().includes(term.toLowerCase())).slice(0, 10)));
        };

        await Promise.all(this.characters.map(async (character) => this.getCharacterInfo(character)));

        this.skillQueueInterval = window.setInterval(() => {
            const now = new Date();

            for (const character of this.characters) {
                if (character.currentTrainingFinish) {
                    character.currentTrainingCountdown = countdown(now, character.currentTrainingFinish, this.countdownUnits);
                    DashboardComponent.adjustCountDownForDST(character.currentTrainingFinish, character.currentTrainingCountdown);
                }

                if (character.totalTrainingFinish) {
                    character.totalTrainingCountdown = countdown(now, character.totalTrainingFinish, this.countdownUnits);
                    DashboardComponent.adjustCountDownForDST(character.totalTrainingFinish, character.totalTrainingCountdown);
                }
            }
        }, Calc.second);

        let earliestSkillComplete = Infinity;
        for (const character of this.characters) {
            if (character.currentTrainingFinish) {
                const timeUntilSkillComplete = character.currentTrainingFinish.getTime() - Date.now();
                if (timeUntilSkillComplete > 0 && character.currentTrainingFinish.getTime() < earliestSkillComplete) {
                    earliestSkillComplete = character.currentTrainingFinish.getTime();
                }
            }
        }

        if (earliestSkillComplete < Infinity && earliestSkillComplete - Date.now() > 0) {
            const timeUntilEarliestSkillComplete = earliestSkillComplete - Date.now();
            if (timeUntilEarliestSkillComplete < Calc.maxIntegerValue) {
                this.skillQueueTimer = window.setTimeout(() => this.softReload, timeUntilEarliestSkillComplete);
            }
        }

        this.setSortOption(this.selectedSortOption);
    }

    public filterCharacters() {
        if (!this.characterSearch || this.characterSearch.length === 0) {
            this.charactersFiltered = this.characters;
        } else {
            const search: string = this.characterSearch.toLowerCase();
            this.charactersFiltered = this.characters.filter((character) => character.name.toLowerCase().includes(search));
        }
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        if (this.skillQueueInterval) {
            clearInterval(this.skillQueueInterval);
        }
        if (this.skillQueueTimer) {
            clearTimeout(this.skillQueueTimer);
        }
    }

    public isCharacterSelected = (character: Character) => character === CharacterService.selectedCharacter;

    public skillQueueLow =
        // tslint:disable-next-line:semicolon
        (character: Character) => character.totalTrainingFinish && character.totalTrainingFinish.getTime() < (Date.now() + 86400000);

    public getActivateButtonClass = (character: Character) => this.isCharacterSelected(character) ? 'btn-success' : 'btn-outline-success';

    public romanize = (num: number) => romanize(num);

    public switchToCharacter = (character: Character) => this.characterService.setActiveCharacter(character).then();

    public authCharacter(character?: Character) {
        this.characterService.setActiveCharacter(character).then();
        this.router.navigate(['/scopes']).then();
    }

    public setSortOption(selectedSortOption: sortOption) {

        let property: sortProperties;
        let inverse = false;

        switch (selectedSortOption) {
            case this.sortOptions[0]:
                property = 'name';
                break;

            case this.sortOptions[1]:
                property = 'birthday';
                break;

            case this.sortOptions[2]:
                property = 'totalTrainingFinish';
                break;

            case this.sortOptions[3]:
                property = 'balance';
                inverse = true;
                break;

            default:
                property = 'name';
                break;
        }

        const sortableCharacters = this.characters.filter((character) => character[property]);
        const unSortableCharacters = this.characters.filter((character) => !character[property]);

        sortArrayByObjectProperty(sortableCharacters, property, this.sortInverted ? !inverse : inverse);
        this.characters = [...sortableCharacters, ...unSortableCharacters];
        this.filterCharacters();
        this.selectedSortOption = selectedSortOption;
        localStorage.setItem('DashboardSorting', selectedSortOption);
    }

    public invertSort() {
        this.sortInverted = !this.sortInverted;
        localStorage.setItem('DashboardSortingInverted', this.sortInverted.toString());
        this.setSortOption(this.selectedSortOption);
    }

    public async getCharacterInfo(character: Character) {
        await Promise.all([
            this.hasShipTypeScope(character) ? this.getShipData(character) : undefined,
            this.hasSkillQueueScope(character) ? this.getSkillQueueData(character) : undefined,
            this.hasWalletScope(character) ? this.getCharacterWalletBalance(character) : undefined,
        ]);
    }

    public async deleteCharacter(character: Character) {
        this.deleteInProgress = true;
        await this.userService.deleteCharacter(character);
        this.deleteInProgress = false;
        this.softReload();
    }

    public async getCharacterWalletBalance(character: Character) {
        character.balance = await this.walletService.getWalletBalance(character);
    }

    public hasWalletScope = (character: Character) => character.hasScope(Scope.WALLET);
    public hasShipTypeScope = (character: Character) => character.hasScope(Scope.SHIP_TYPE);
    public hasSkillQueueScope = (character: Character) => character.hasScope(Scope.SKILLQUEUE);

    public async getShipData(character: Character): Promise<void> {
        const shipData: { id: number, name: string } = await this.shipService.getCurrentShip(character);
        character.currentShip.id = shipData.id;
        character.currentShip.name = shipData.name;
        await this.namesService.getNames(character.currentShip.id);
        character.currentShip.type = NamesService.getNameFromData(character.currentShip.id, 'Unknown ship');
    }

    public async goToCharacterSkillPage(character: Character) {
        await this.characterService.setActiveCharacter(character);
        this.router.navigate(['/skills']).then();
    }

    public async goToCharacterWalletPage(character: Character) {
        await this.characterService.setActiveCharacter(character);
        this.router.navigate(['/wallet']).then();
    }

    public async getSkillQueueData(character: Character): Promise<void> {

        const skillQueueData = await this.skillQueueService.getSkillQueue(character);

        let latestFinishDate: Date = new Date();

        for (const skillInQueue of skillQueueData) {
            if (skillInQueue.start_date && skillInQueue.finish_date) {

                const now = new Date();
                const startDate = new Date(skillInQueue.start_date);
                const finishDate = new Date(skillInQueue.finish_date);

                if (!latestFinishDate || latestFinishDate < finishDate) {
                    latestFinishDate = finishDate;
                }

                if (startDate < now && now < finishDate) {
                    await this.namesService.getNames(skillInQueue.skill_id);
                    character.currentTrainingSkill = skillInQueue;
                    character.currentTrainingSkill.name = NamesService.getNameFromData(skillInQueue.skill_id);
                    character.currentTrainingFinish = finishDate;
                    character.currentTrainingCountdown = countdown(now, finishDate, this.countdownUnits);
                    DashboardComponent.adjustCountDownForDST(character.currentTrainingFinish, character.currentTrainingCountdown);
                }

                character.totalTrainingFinish = latestFinishDate;
                character.totalTrainingCountdown = countdown(now, finishDate, this.countdownUnits);
                DashboardComponent.adjustCountDownForDST(character.totalTrainingFinish, character.totalTrainingCountdown);
            }
        }
    }
}
