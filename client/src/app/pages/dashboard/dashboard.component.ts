import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as countdown from 'countdown';

import { Common } from '../../../shared/common.helper';
import { NamesService } from '../../data-services/names.service';
import { ShipService } from '../../data-services/ship.service';
import { SkillQueueService } from '../../data-services/skillqueue.service';
import { Character } from '../../models/character/character.model';
import { CharacterService } from '../../models/character/character.service';
import { UserService } from '../../models/user/user.service';
import { DataPageComponent } from '../data-page/data-page.component';
import { WalletService } from '../../data-services/wallet.service';

@Component({
    selector: 'app-dashboard',
    styleUrls: ['./dashboard.component.scss'],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent extends DataPageComponent implements OnInit, OnDestroy {

    public characters: Character[] = [];
    public deleteInProgress = false;

    public skillQueueInterval?: number;
    public skillQueueTimer?: number;

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

    public async ngOnInit() {
        super.ngOnInit();
        this.characters = UserService.user.characters;

        await Promise.all(this.characters.map(async (character) => this.getCharacterInfo(character)));

        this.skillQueueInterval = window.setInterval(() => {
            const now = new Date();

            for (const character of this.characters) {
                if (character.currentTrainingSkill && character.currentTrainingFinish) {
                    character.currentTrainingCountdown = countdown(now, character.currentTrainingFinish, this.countdownUnits);
                }
            }
        }, 1000);

        let earliestSkillComplete = Infinity;
        for (const character of this.characters) {
            if (character.currentTrainingFinish && character.currentTrainingFinish.getTime() < earliestSkillComplete) {
                earliestSkillComplete = character.currentTrainingFinish.getTime();
            }
        }

        if (earliestSkillComplete < Infinity) {
            this.skillQueueTimer = window.setTimeout(() => this.softReload(), earliestSkillComplete);
        }
    }

    public ngOnDestroy() {
        super.ngOnDestroy();
        if (this.skillQueueInterval) {
            clearInterval(this.skillQueueInterval);
        }
    }

    public isCharacterSelected = (character: Character) => character === CharacterService.selectedCharacter;

    public getActivateButtonClass = (character: Character) => this.isCharacterSelected(character) ? 'btn-success' : 'btn-outline-success';

    public romanize = (num: number) => Common.romanize(num);

    public switchToCharacter = (character: Character) => this.characterService.setActiveCharacter(character).then();

    public authCharacter = (character?: Character) => this.userService.authCharacter(character);

    public async getCharacterInfo(character: Character) {
        await Promise.all([
            this.getShipData(character),
            this.getSkillQueueData(character),
            this.getCharacterWalletBalance(character),
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

        for (const skillInQueue of skillQueueData) {
            if (skillInQueue.start_date && skillInQueue.finish_date) {

                const now = new Date();
                const startDate = new Date(skillInQueue.start_date);
                const finishDate = new Date(skillInQueue.finish_date);

                if (startDate < now && now < finishDate) {
                    await this.namesService.getNames(skillInQueue.skill_id);
                    character.currentTrainingSkill = skillInQueue;
                    character.currentTrainingSkill.name = NamesService.getNameFromData(skillInQueue.skill_id);
                    character.currentTrainingFinish = finishDate;
                    character.currentTrainingCountdown = countdown(now, finishDate, this.countdownUnits);
                }
            }
        }
    }
}
