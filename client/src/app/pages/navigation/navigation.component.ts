import { Component, OnInit } from '@angular/core';
import { ClockService } from './clock.service';
import { Globals } from '../../globals';
import { TranslateService } from 'ng2-translate';
import { EndpointService } from '../../components/endpoint/endpoint.service';
import { CountUp } from '../../components/count-up';
import { UserService } from '../../components/user/user.service';
import { Router } from '@angular/router';

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
  countup: CountUp;
  disable: boolean = true;

  constructor(private clock: ClockService,
              private router: Router,
              private globals: Globals,
              private translate: TranslateService,
              private es: EndpointService,
              private userService: UserService) { }

  ngOnInit(): void {
    this.globals.isLoggedIn.subscribe(() => {
      if (this.globals.selectedCharacter) {
        this.char = this.globals.selectedCharacter.characterId;
        this.disable = false;
      }
    });
    this.countup = new CountUp('eve-players', 0, 0);
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
    this.countup.reset();
    this.hours = time['hours'];
    this.minutes = time['minutes'];
    this.status = time['status'];
    this.time = time;
    setTimeout(() => {
      this.countup.update(time['players']);
    }, 400); // Compensate for pre-bootstrap-container fadeout
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
