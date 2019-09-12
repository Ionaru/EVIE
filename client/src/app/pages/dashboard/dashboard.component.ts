import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faCheck, faSync, faTrash, faUserPlus } from '@fortawesome/pro-regular-svg-icons';
import { sortArrayByObjectProperty } from '@ionaru/array-utils';
import { romanize } from '@ionaru/romanize';
import * as countdown from 'countdown';

import { Calc } from '../../../shared/calc.helper';
import { NamesService } from '../../data-services/names.service';
import { ShipService } from '../../data-services/ship.service';
import { SkillQueueService } from '../../data-services/skillqueue.service';
import { WalletService } from '../../data-services/wallet.service';
import { Character } from '../../models/character/character.model';
import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { ScopesComponent } from '../scopes/scopes.component';
import { SkillsComponent } from '../skills/skills.component';

type sortOption = 'name' | 'skillqueue' | 'ISK';

@Component({
    selector: 'app-dashboard',
    styleUrls: ['./dashboard.component.scss'],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent extends DataPageComponent implements OnInit, OnDestroy {

    private static adjustCountDownForDST(finish: Date, cd: number | countdown.Timespan) {
        if (typeof cd !== 'number') {
            const timeLeft = finish.getTime() - Date.now();
            SkillsComponent.adjustCountDownForDST(cd, timeLeft);
        }
    }

    public faUserPlus = faUserPlus;
    public faCheck = faCheck;
    public faSync = faSync;
    public faTrash = faTrash;

    public characters: Character[] = [];
    public deleteInProgress = false;

    public skillQueueInterval?: number;
    public skillQueueTimer?: number;

    public sortOptions: sortOption[] = ['name', 'skillqueue', 'ISK'];
    public selectedSortOption: sortOption = this.sortOptions[0];
    public sortInverted = false;

    // tslint:disable-next-line:no-bitwise
    private readonly countdownUnits = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS;

    constructor(private userService: UserService, private characterService: CharacterService, private shipService: ShipService,
                private namesService: NamesService, private skillQueueService: SkillQueueService, private router: Router,
                private walletService: WalletService) {
        super();

        countdown.setLabels(
            '|s|m|h|d',
            '|s|m|h|d',
            ', ');
    }

    // tslint:disable-next-line:cognitive-complexity
    public async ngOnInit() {
        super.ngOnInit();
        this.characters = UserService.user.characters;

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
        if (character) {
            this.characterService.setActiveCharacter(character).then();
        } else {
            this.characterService.setActiveCharacter().then();
        }
        this.router.navigate(['/scopes']).then();
    }

    public setSortOption(selectedSortOption: sortOption) {

        let property = '';
        let inverse = false;

        switch (selectedSortOption) {
            case this.sortOptions[0]:
                property = 'name';
                break;

            case this.sortOptions[1]:
                property = 'totalTrainingFinish';
                break;

            case this.sortOptions[2]:
                property = 'balance';
                inverse = true;
                break;
        }

        sortArrayByObjectProperty(this.characters, property, this.sortInverted ? !inverse : inverse);
        this.selectedSortOption = selectedSortOption;
    }

    public invertSort() {
        this.sortInverted = !this.sortInverted;
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
    }

    public async getCharacterWalletBalance(character: Character) {
        character.balance = await this.walletService.getWalletBalance(character);
    }

    public hasWalletScope = (character: Character) => character.hasScope(ScopesComponent.scopeCodes.WALLET);
    public hasShipTypeScope = (character: Character) => character.hasScope(ScopesComponent.scopeCodes.SHIP_TYPE);
    public hasSkillQueueScope = (character: Character) => character.hasScope(ScopesComponent.scopeCodes.SKILLQUEUE);

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
