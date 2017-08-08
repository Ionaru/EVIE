import { Component, OnInit } from '@angular/core';

import { UserService } from '../../../models/user/user.service';
import { ClockService, IServerStatus } from '../../../services/clock.service';
import { CountUp } from '../../../shared/count-up';
import { Globals } from '../../../shared/globals';

@Component({
  providers: [ClockService],
  selector: 'app-navigation',
  styleUrls: ['navigation.component.scss'],
  templateUrl: 'navigation.component.html',
})
export class NavigationComponent implements OnInit {

  public hours = '00';
  public minutes = '00';
  public status = 'Offline';
  public time: IServerStatus;
  public char = 1;
  public playersCountUp: CountUp;
  public disable = true;
  public isLoggedIn = false;

  constructor(private clock: ClockService,
              private globals: Globals,
              private userService: UserService) {
    this.globals.characterChangeEvent.subscribe((character) => {
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

  public ngOnInit(): void {
    this.playersCountUp = new CountUp('eve-players', 0, 0);
    this.syncClock();
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
    this.clock.getTime().subscribe(
      (time: IServerStatus) => {
        this.updateClock(time);
        setTimeout(() => {
          this.timeKeeper();
        }, 60000 - (time.seconds * 1000));
      },
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

  private updateClock(time: IServerStatus): void {
    this.playersCountUp.reset();
    this.hours = time.hours;
    this.minutes = time.minutes;
    this.status = time.status;
    this.time = time;
    if (this.globals.startUp) {
      this.playersCountUp.update(time.players);
    } else {
      this.globals.startUpObservable.subscribe(() => {
        this.playersCountUp.update(time.players);
      });
    }
  }
}
