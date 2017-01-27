import { Component } from '@angular/core';
import { TranslateService } from 'ng2-translate';
import { AppReadyEvent } from './app-ready-event';
import { UserService } from './components/user/user.service';
import { CharacterService } from './components/character/character.service';
import { Globals } from './globals';
import { EndpointService } from './components/endpoint/endpoint.service';
import { Observable, Observer } from 'rxjs';
import { Router } from '@angular/router';
import * as socketIo from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['app.component.scss'],
  providers: [AppReadyEvent, UserService, CharacterService, EndpointService],
})
export class AppComponent {
  static translate: TranslateService;

  appVersion: string = '2.0.0-ALPHA-1';
  XMLVersion: string = '?';
  ESIVersion: string = '?';

  constructor(private translate: TranslateService,
              private userService: UserService,
              private characterService: CharacterService,
              private appReadyEvent: AppReadyEvent,
              private endpointService: EndpointService,
              private globals: Globals,
              private router: Router) {

    // At this point, the application has "loaded" in so much as the assets have
    // loaded; but, the we're not going to consider the application "ready" until
    // the core "data" has loaded. As such, we won't trigger the "appready" event
    // just yet

    // this language will be used as a fallback when a translation isn't found in the current language
    let defaultLang = 'en';
    translate.setDefaultLang(defaultLang);

    // the language to use, if the lang isn't available, it will use the current loader to get them
    translate.use(defaultLang);
    AppComponent.translate = translate;

    this.boot();

    globals.startUpObservable.subscribe(() => {
      this.globals.socket = socketIo('http://localhost:3000', {
        reconnection: true
      });
      this.globals.socket.on('STOP', (): void => {
        window.location.reload();
      });
      this.appReadyEvent.trigger();
    });
  }

  private boot(): void {

    this.endpointService.getXMLAPI().subscribe(() => {
      this.XMLVersion = this.endpointService.XML['eveapi']['@attributes']['version'];
    });

    this.endpointService.getESIAPI().subscribe((data) => {
      this.ESIVersion = data['info']['version'];
    });

    this.globals.startUpObservable = Observable.create((observer: Observer<boolean>) => {
      this.userService.shakeHands().subscribe(() => {
        console.log('shakeHands');
        this.globals.startUp = true;
        observer.next(true);
        observer.complete();
      });
    }).share();
  }
}

// Export this function so we can access it anywhere
export function switchLanguage(lang: string): void {
  if (AppComponent.translate.currentLang !== lang) {
    AppComponent.translate.use(lang);
  }
}

export function getCurrentLang(): string {
  return AppComponent.translate.currentLang;
}
