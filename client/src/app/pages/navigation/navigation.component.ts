import { Component, OnInit } from '@angular/core';
import { ClockService } from './clock.service';
import { Globals } from '../../globals';
import { TranslateService } from 'ng2-translate';
import { EndpointService } from '../../components/endpoint/endpoint.service';

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
  char: number;
  players: number;

  constructor(private clock: ClockService,
              private globals: Globals,
              private translate: TranslateService,
              private es: EndpointService) {
    if (this.globals.activeAccount) {
      this.char = globals.selectedCharacter.id;
    } else {
      this.char = 1;
    }
  }

  ngOnInit(): void {
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
    this.hours = time['hours'];
    this.minutes = time['minutes'];
    this.status = time['status'];
    this.time = time;
    this.players = time['players'];
  }

  checkAccess(): boolean {
    // return this.char !== 1;
    return true;
  }

  // changeLanguage(lang: string): void {
  //   if (this.translate.currentLang === 'nl') {
  //     switchLanguage('en');
  //   } else {
  //     switchLanguage('nl');
  //   }
  // }
}
