import { Component } from '@angular/core';
import { TranslateService } from 'ng2-translate';
import { AppReadyEvent } from './app-ready-event';
import { UserService } from './components/user/user.service';
import { AccountService } from './components/account/account.service';
import { CharacterService } from './components/character/character.service';
import { Globals } from './globals';
import { EndpointService } from './components/endpoint/endpoint.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['app.component.scss'],
  providers: [AppReadyEvent, AccountService, UserService, CharacterService, EndpointService],
})
export class AppComponent {
  static translate: TranslateService;

  version: string = '2.0.0-ALPHA-1';
  char: number;
  players: number;

  constructor(translate: TranslateService,
              private userService: UserService,
              private accountService: AccountService,
              private characterService: CharacterService,
              private appReadyEvent: AppReadyEvent,
              private endpointService: EndpointService,
              private globals: Globals) {

    // At this point, the application has "loaded" in so much as the assets have
    // loaded; but, the we're not going to consider the application "ready" until
    // the core "data" has loaded. As such, we won't trigger the "appready" event
    // until the account has been loaded.


    // if (localStorage.getItem('account')) {
    //   let acc = JSON.parse(localStorage.getItem('account'));
    //   globals.activeAccount = new Account(acc.name, acc.keyID, acc.vCode);
    // } else {
    //   globals.activeAccount = new Account('myAccount', ***, '***');
    // }
    // if (localStorage.getItem('character')) {
    //   let char = JSON.parse(localStorage.getItem('character'));
    //   globals.selectedCharacter = new Character(char.id, globals.activeAccount);
    // } else {
    //   globals.selectedCharacter = new Character(***, globals.activeAccount);
    // }
    //
    // localStorage.setItem('account', JSON.stringify(globals.activeAccount));
    // localStorage.setItem('character', JSON.stringify(globals.selectedCharacter));

    // globals.DOMParser = new DOMParser();
    // globals.activeAccount.addCharacter(globals.selectedCharacter);
    // globals.selectedCharacter.balance = 5000;

    // this language will be used as a fallback when a translation isn't found in the current language
    let defaultLang = 'en';
    translate.setDefaultLang(defaultLang);

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use(defaultLang);
    AppComponent.translate = translate;

    this.startUp();
    globals.isLoggedIn.subscribe(() => {
      console.log('Logged in!');
    });
  }

  private startUp(): void {
    if (localStorage.getItem('User')) {

    }
    this.endpointService.getEndpointsAPI().subscribe(() => {
      this.appReadyEvent.trigger();
    });

    this.globals.isLoggedIn = Observable.create((o) => {
      this.userService.getUser().subscribe(
        (user) => {
          localStorage.setItem('User', JSON.stringify(user));
          this.globals.activeAccount = user.accounts[user.selectedAccount];

          this.accountService.getAccountData(user.accounts[user.selectedAccount]).subscribe(
            (account) => {
              let selectedCharacter = 0;
              this.globals.selectedCharacter = account.characters[selectedCharacter];

              this.characterService.getCharacterData(account.characters[selectedCharacter]).subscribe(
                (character) => {
                  console.log(character);
                  o.next(true);
                  o.complete();
                }
              );
            }
          );
        }
      );
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
