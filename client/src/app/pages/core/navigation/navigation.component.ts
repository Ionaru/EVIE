import { Component, OnInit } from '@angular/core';
import { ClockService } from '../../../services/clock.service';
import { Globals } from '../../../shared/globals';
import { CountUp } from '../../../shared/count-up';
import { UserService } from '../../../models/user/user.service';

@Component({
  selector: 'app-navigation',
  templateUrl: 'navigation.component.html',
  styleUrls: ['navigation.component.scss'],
  providers: [ClockService],
})
export class NavigationComponent implements OnInit {

  hours = '00';
  minutes = '00';
  status = 'Offline';
  time: Object;
  char = 1;
  players: number;
  playersCountUp: CountUp;
  disable = true;
  isLoggedIn = false;

  constructor(private clock: ClockService,
              private globals: Globals,
              private userService: UserService) {
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
  }

  ngOnInit(): void {
    // this.playersCountUp = new CountUp('eve-players', 0, 0);
    this.syncClock();
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
    const eveTime = setInterval(() => {
      this.updateClock(ClockService.tickTime(this.time));
    }, 60000);
    setTimeout(() => {
      clearInterval(eveTime);
      this.syncClock();
    }, 180000);
  }

  private updateClock(time: Object): void {
    // this.playersCountUp.reset();
    // this.hours = time['hours'];
    // this.minutes = time['minutes'];
    // this.status = time['status'];
    // this.time = time;
    // if (this.globals.startUp) {
    //   this.playersCountUp.update(time['players']);
    // } else {
    //   this.globals.startUpObservable.subscribe(() => {
    //     this.playersCountUp.update(time['players']);
    //   });
    // }
  }
}
