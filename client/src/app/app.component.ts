import { Component } from '@angular/core';
import { TranslateService } from 'ng2-translate';
import { AppReadyEvent } from './app-ready-event';
import { UserService } from './components/user/user.service';
import { CharacterService } from './components/character/character.service';
import { Globals } from './globals';
import { EndpointService } from './components/endpoint/endpoint.service';
import { Observable, Observer } from 'rxjs';
import { Router } from '@angular/router';
import { User } from './components/user/user';
import { isEmpty } from './components/helperfunctions.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['app.component.scss'],
  providers: [AppReadyEvent, UserService, CharacterService, EndpointService],
})
export class AppComponent {
  static translate: TranslateService;

  version: string = '2.0.0-ALPHA-1';
  char: number;
  players: number;

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

    this.startUp();
    globals.isLoggedIn.subscribe(() => {
      // console.log('Logged in!');
      this.appReadyEvent.trigger();
    });
  }

  private startUp(): void {
    this.endpointService.getEndpointsAPI().subscribe(() => {
      // this.appReadyEvent.trigger();
    });

    this.globals.isLoggedIn = Observable.create((observer: Observer<boolean>) => {
      this.userService.getUser().subscribe(
        (user: User) => {
          if (user) {
            this.globals.user = user;
            // localStorage.setItem('User', JSON.stringify(user));
            // console.log(user);
            // console.log(user.accounts);
            if (!isEmpty(user.characters)) {
              // this.globals.activeAccount = user.characters[user.selectedAccount];
              this.getCharacter(observer);
            } else {
              // User has to add an EVE character
              this.router.navigate(['/dashboard']).then();
              observer.next(false);
              observer.complete();
            }
          } else {
            // User has to log in
            this.router.navigate(['/']).then();
            observer.next(false);
            observer.complete();
          }
        },
      );
    }).share();
  }

  private getCharacter(observer: Observer<boolean>): void {
    this.characterService.getCharacterData(this.globals.selectedCharacter).subscribe(
      () => {
        observer.next(true);
        observer.complete();
      }
    );
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