import { Component, OnInit } from '@angular/core';

import { UserService } from '../models/user/user.service';
import { StatusService } from '../data-services/status.service';
import { CharacterService } from '../models/character/character.service';
// import { ClockService, IServerStatus } from '../../../services/clock.service';
// import { CountUp } from '../../../shared/count-up';
// import { Globals } from '../../../shared/globals';

@Component({
    selector: 'app-navigation',
    styleUrls: ['navigation.component.scss'],
    templateUrl: 'navigation.component.html',
})
export class NavigationComponent implements OnInit {

    public hours = '00';
    public minutes = '00';
    public status = 'Offline';
    // public time: IServerStatus;
    public char = 1;
    // public playersCountUp: CountUp;
    public disable = true;
    public isLoggedIn = false;
    public playerCount: number;
    public isCollapsed: boolean;

    constructor(private userService: UserService, private statusService: StatusService) {
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

    public ngOnInit(): void {
        // this.playersCountUp = new CountUp('eve-players', 0, 0);
        this.syncClock();
        this.getStatus().then();
    }

    public async getStatus(): Promise<void> {
        const status = await this.statusService.getStatus();
        if (status) {
            this.playerCount = status.players;
        }
        setTimeout(() => {
            this.getStatus().then();
        }, 45000);
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
        this.userService.logoutUser();
    }

    private syncClock(): void {
        const time = new Date();
        this.tickTime(time);
        const tickTimeout = 60 - time.getUTCSeconds();
        setTimeout(() => {
            this.timeKeeper();
            }, tickTimeout * 1000);
    }

    private timeKeeper(): void {
        this.tickTime();
        const eveTime = setInterval(() => {
            this.tickTime();
        }, 60000);
        setTimeout(() => {
            clearInterval(eveTime);
            this.syncClock();
        }, 180000);
    }

    private tickTime(newTime?: Date): void {
        let hours: number;
        let minutes: number;

        let hoursString: string;
        let minutesString: string;

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
