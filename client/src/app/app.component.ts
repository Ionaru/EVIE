import { Component } from '@angular/core';
import { Response } from '@angular/http';
import { Observable, Observer } from 'rxjs';
import * as socketIo from 'socket.io-client';

import { AppReadyEvent } from './app-ready.event';
import { CharacterService } from './models/character/character.service';
import { EndpointService } from './models/endpoint/endpoint.service';
import { UserService } from './models/user/user.service';
import { NamesService } from './services/names.service';
import { Globals } from './shared/globals';
import { Helpers } from './shared/helpers';

@Component({
  providers: [AppReadyEvent, UserService, CharacterService, EndpointService, NamesService, Helpers],
  selector: 'app-root',
  styleUrls: ['app.component.scss'],
  templateUrl: './app.component.html',
})
export class AppComponent {

  public static appName = 'EVE Track';
  public static appVersion = '0.1.0-INDEV';

  constructor(private userService: UserService, private appReadyEvent: AppReadyEvent, private globals: Globals) {
    this.boot();
  }

  //noinspection JSMethodCanBeStatic
  public getAppVersion(): string {
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
        document.getElementById('error-info').innerText = response.text();
        document.getElementById('error-info-detail').innerText = response.toString();
      }
    }).share();

    this.globals.startUpObservable.subscribe(() => {
      this.globals.socket = socketIo('http://localhost:3000/', {
        reconnection: true,
      });
      this.globals.socket.on('STOP', (): void => {
        // The server will send STOP upon shutting down, reloading the window ensures nobody keeps using the site while the server is down.
        window.location.reload();
      });
      this.appReadyEvent.trigger();
    });
  }
}
