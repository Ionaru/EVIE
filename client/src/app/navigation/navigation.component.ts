import { Component, OnInit } from '@angular/core';
import { faCircle } from '@fortawesome/pro-regular-svg-icons';
import {
    faAbacus,
    faCalculator,
    faChevronDown,
    faCircle as faSolidCircle,
    faCloud,
    faColumns,
    faDiceD10,
    faDiceD6,
    faDiceD8,
    faHexagon,
    faHome,
    faPlug,
    faQuestion, faRecycle,
    faSignOut,
    faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';

import { environment } from '../../environments/environment';
import { Calc } from '../../shared/calc.helper';
import { StatusService } from '../data-services/status.service';
import { LogoutModalComponent } from '../modals/logout/logout-modal.component';
import { CharacterService } from '../models/character/character.service';
import { UserService } from '../models/user/user.service';
import { CountUp } from '../shared/count-up';

@Component({
    selector: 'app-navigation',
    styleUrls: ['navigation.component.scss'],
    templateUrl: 'navigation.component.html',
})
export class NavigationComponent implements OnInit {

    public static serverOnline = true;

    public static readonly serverStatusEvent = new Subject<boolean>();
    public static readonly requestCounterUpdateEvent = new Subject<number>();

    public industryToolsIcon = faAbacus;
    public faChevronDown = faChevronDown;
    public homeIcon = faHome;
    public dashboardIcon = faColumns;
    public userAdminIcon = faUsers;
    public connectionIcon = faPlug;
    public logoutIcon = faSignOut;
    public aboutIcon = faQuestion;
    public orePricesIcon = faDiceD6;
    public icePricesIcon = faDiceD8;
    public gasPricesIcon = faCloud;
    public mineralsIcon = faDiceD10;
    public productionCalculatorIcon = faCalculator;
    public reprocessingIcon = faRecycle;

    public iskIconBase = faHexagon;

    public requestsActiveIcon = faSolidCircle;
    public requestsInactiveIcon = faCircle;

    public hours = '00';
    public minutes = '00';
    public char = 1;
    public activatedCharacter = false;
    public hasCharacters = false;
    public isLoggedIn = false;
    public isAdmin = false;
    public isCollapsed!: boolean;
    public playersCountUp!: CountUp;

    public requestsActive = false;

    constructor(private statusService: StatusService, private modalService: NgbModal, private characterService: CharacterService) { }

    // noinspection JSMethodCanBeStatic
    public get serverOnline() {
        return NavigationComponent.serverOnline;
    }

    // noinspection JSMethodCanBeStatic
    public get devEnvironment(): boolean {
        return !environment.production;
    }

    public ngOnInit(): void {
        NavigationComponent.requestCounterUpdateEvent.subscribe((count) => {
            this.requestsActive = (count > 0);
        });

        CharacterService.characterChangeEvent.subscribe((character) => {
            if (character) {
                this.char = character.characterId;
                this.activatedCharacter = true;
            } else {
                this.char = 1;
                this.activatedCharacter = false;
            }
            this.hasCharacters = UserService.user.characters.length > 0;
        });

        UserService.userChangeEvent.subscribe((user) => {
            this.isLoggedIn = !!user;
            this.isAdmin = user && user.isAdmin;
            this.hasCharacters = UserService.user.characters.length > 0;
        });

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
        }, 45 * Calc.second);
    }

    public nextCharacter(): void {
        let nextCharacterIndex = 0;
        if (CharacterService.selectedCharacter) {
            const currentCharacterIndex = UserService.user.characters.indexOf(CharacterService.selectedCharacter);
            nextCharacterIndex = UserService.user.characters.length > (currentCharacterIndex + 1) ? currentCharacterIndex + 1 : 0;
        }
        this.characterService.setActiveCharacter(UserService.user.characters[nextCharacterIndex]).then();
    }

    public logout = () => this.modalService.open(LogoutModalComponent);

    private syncClock(): void {
        const time = new Date();
        this.tickTime(time);
        const tickTimeout = 60 - time.getUTCSeconds();
        window.setTimeout(() => {
            this.startClock();
        }, Calc.secondsToMilliseconds(tickTimeout));
    }

    private startClock(): void {
        this.tickTime();
        const eveTime = window.setInterval(() => {
            this.tickTime();
        }, Calc.minute);
        window.setTimeout(() => {
            window.clearInterval(eveTime);
            this.syncClock();
        }, 3 * Calc.minute);
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
