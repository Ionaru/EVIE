import { HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
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

  constructor(private userService: UserService, private appReadyEvent: AppReadyEvent, private globals: Globals) {
    this.boot();
  }

  private boot(): void {
    this.globals.startUpObservable = Observable.create(async (observer: Observer<boolean>) => {
      const response: HttpResponse<null> = await this.userService.shakeHands();
      if (response.ok) {
        this.globals.startUp = true;
        observer.next(true);
        observer.complete();
      } else {
        this.appReadyEvent.triggerFailed();
        document.getElementById('error-info').innerText = response.body;
        document.getElementById('error-info-detail').innerText = JSON.stringify(response);
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
