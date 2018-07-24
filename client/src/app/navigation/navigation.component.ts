import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/index';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StatusService } from '../data-services/status.service';
import { CharacterService } from '../models/character/character.service';
import { UserService } from '../models/user/user.service';
import { CountUp } from '../shared/count-up';
import { LogoutModalComponent } from './logout-modal.component';

@Component({
    selector: 'app-navigation',
    styleUrls: ['navigation.component.scss'],
    templateUrl: 'navigation.component.html',
})
export class NavigationComponent implements OnInit {

    public static serverOnline = false;

    private static _serverStatusEvent = new Subject<boolean>();
    public static get serverStatusEvent() { return this._serverStatusEvent; }

    public hours = '00';
    public minutes = '00';
    public char = 1;
    public disable = true;
    public isLoggedIn = false;
    public isCollapsed!: boolean;
    public playersCountUp!: CountUp;

    constructor(private userService: UserService, private statusService: StatusService,
                private characterService: CharacterService, private modalService: NgbModal) {
        CharacterService.characterChangeEvent.subscribe((character) => {
          if (character) {
            this.char = character.characterId;
            this.disable = false;
          } else {
            this.char = 1;
            this.disable = true;
          }
        });

        UserService.userChangeEvent.subscribe((user) => {
          this.isLoggedIn = !!user;
        });
    }

    // noinspection JSMethodCanBeStatic
    public get serverOnline() {
        return NavigationComponent.serverOnline;
    }

    public ngOnInit(): void {
        this.playersCountUp = new CountUp('eve-players', 0, 0);
        this.syncClock();
        this.getStatus().then();
    }

    public async getStatus(): Promise<void> {
        const status = await this.statusService.getStatus();

        if (!NavigationComponent.serverOnline && !!status) {
            NavigationComponent.serverStatusEvent.next(true);
        }

        NavigationComponent.serverOnline = !!status;

        const playerCount = status ? status.players : 0;
        this.playersCountUp.update(playerCount);

        window.setTimeout(() => {
            this.getStatus().then();
        }, 45000);
    }

    public nextCharacter(): void {
        let nextCharacterIndex = 0;
        if (CharacterService.selectedCharacter) {
            const currentCharacterIndex = UserService.user.characters.indexOf(CharacterService.selectedCharacter);
            nextCharacterIndex = UserService.user.characters.length > (currentCharacterIndex + 1) ? currentCharacterIndex + 1 : 0;
        }
        this.characterService.setActiveCharacter(UserService.user.characters[nextCharacterIndex]).then();
    }

    public checkAccess(): boolean {
        // if (this.disable) {
        //   return false;
        // }
        // // return this.char !== 1;
        // return true;
        return this.disable;
    }

    public logout(): void {
        this.modalService.open(LogoutModalComponent);
    }

    private syncClock(): void {
        const time = new Date();
        this.tickTime(time);
        const tickTimeout = 60 - time.getUTCSeconds();
        window.setTimeout(() => {
            this.startClock();
            }, tickTimeout * 1000);
    }

    private startClock(): void {
        this.tickTime();
        const eveTime = window.setInterval(() => {
            this.tickTime();
        }, 60000);
        window.setTimeout(() => {
            window.clearInterval(eveTime);
            this.syncClock();
        }, 180000);
    }

    private tickTime(newTime?: Date): void {
        let hours: number;
        let minutes: number;

        let hoursString = '';
        let minutesString = '';

        if (newTime) {
            hours = newTime.getUTCHours();
            minutes = newTime.getUTCMinutes();
        } else {
            hours = parseInt(this.hours, 10);
            minutes = parseInt(this.minutes, 10) + 1;
        }

        if (minutes === 60) {
            hours += 1;
            minutes = 0;
        }
        if (minutes < 10) {
            minutesString = '0' + minutes.toString();
        }
        if (hours === 24) {
            hours = 0;
        }
        if (hours < 10) {
            hoursString = '0' + hours.toString();
        }
        this.hours = hoursString || hours.toString();
        this.minutes = minutesString || minutes.toString();
    }
}
