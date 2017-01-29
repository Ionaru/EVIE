import { Component, OnInit } from '@angular/core';
import { ClockService } from './clock.service';
import { Globals } from '../../globals';
import { TranslateService } from 'ng2-translate';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { CountUp } from '../../components/count-up';
import { UserService } from '../../components/user/user.service';
import { Router } from '@angular/router';
import { CharacterService } from '../../components/character/character.service';

@Component({
  selector: 'app-navigation',
  templateUrl: 'navigation.component.html',
  styleUrls: ['navigation.component.scss'],
  providers: [ClockService],
})
export class NavigationComponent implements OnInit {

  hours: string = '00';
  minutes: string = '00';
  status: string = 'Offline';
  time: Object;
  char: number = 1;
  players: number;
  playersCountUp: CountUp;
  disable: boolean = true;
  isLoggedIn = false;

  constructor(private clock: ClockService,
              private router: Router,
              private globals: Globals,
              private translate: TranslateService,
              private es: EndpointService,
              private userService: UserService,
              private characterService: CharacterService) {
  }

  ngOnInit(): void {
    this.globals.characterChangeEvent.subscribe(character => {
      if (character) {
        this.char = character.characterId;
        this.disable = false;
      } else {
        this.char = 1;
        this.disable = true;
      }
    });

    this.globals.userChangeEvent.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
    this.playersCountUp = new CountUp('eve-players', 0, 0);
    this.syncClock();
  }

  private syncClock(): void {
    this.clock.getTime().subscribe(
      (time) => {
        this.updateClock(time);
        setTimeout(() => {
          this.timeKeeper();
        }, 60000 - (time['seconds'] * 1000));
      }
    );
  }

  private timeKeeper(): void {
    this.updateClock(ClockService.tickTime(this.time));
    let eveTime = setInterval(() => {
      this.updateClock(ClockService.tickTime(this.time));
    }, 60000);
    setTimeout(() => {
      clearInterval(eveTime);
      this.syncClock();
    }, 180000);
  }

  private updateClock(time: Object): void {
    this.playersCountUp.reset();
    this.hours = time['hours'];
    this.minutes = time['minutes'];
    this.status = time['status'];
    this.time = time;
    if (this.globals.startUp) {
      this.playersCountUp.update(time['players']);
    } else {
      this.globals.startUpObservable.subscribe(() => {
        this.playersCountUp.update(time['players']);
      });
    }
  }

  checkAccess(): boolean {
    if (this.disable) {
      return false;
    }
    // return this.char !== 1;
    return true;
  }

  logout(): void {
    this.userService.logoutUser();
  }

  // changeLanguage(lang: string): void {
  //   if (this.translate.currentLang === 'nl') {
  //     switchLanguage('en');
  //   } else {
  //     switchLanguage('nl');
  //   }
  // }
}
