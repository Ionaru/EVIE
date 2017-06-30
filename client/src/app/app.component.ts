import { Component } from '@angular/core';
import { Response } from '@angular/http';
import { Observable, Observer } from 'rxjs';
import * as socketIo from 'socket.io-client';

import { AppReadyEvent } from './app-ready.event';
import { CharacterService } from './models/character/character.service';
import { EndpointService } from './models/endpoint/endpoint.service';
import { Globals } from './shared/globals';
import { Helpers } from './shared/helpers';
import { NamesService } from './services/names.service';
import { UserService } from './models/user/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['app.component.scss'],
  providers: [AppReadyEvent, UserService, CharacterService, EndpointService, NamesService, Helpers],
})
export class AppComponent {

  public static appName = 'EVE Track';
  public static appVersion = '0.1.0-INDEV';

  constructor(private userService: UserService, private appReadyEvent: AppReadyEvent, private globals: Globals) {
    this.boot();
  }

  //noinspection JSMethodCanBeStatic
  getAppVersion(): string {
    return AppComponent.appVersion;
  }

  private boot(): void {
    this.globals.startUpObservable = Observable.create(async (observer: Observer<boolean>) => {
      const response: Response = await this.userService.shakeHands();
      if (response.ok) {
        this.globals.startUp = true;
        observer.next(true);
        observer.complete();
      } else {
        this.appReadyEvent.triggerFailed();
        document.getElementById('error-info').innerHTML = response.text();
        document.getElementById('error-info-detail').innerHTML = response.toString();
      }
    }).share();

    this.globals.startUpObservable.subscribe(() => {
      this.globals.socket = socketIo('http://localhost:3000/', {
        reconnection: true
      });
      this.globals.socket.on('STOP', (): void => {
        window.location.reload();
      });
      this.appReadyEvent.trigger();
    });
  }
}
