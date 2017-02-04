import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Http, HttpModule } from '@angular/http';
import {
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
  TranslateLoader,
  TranslateModule,
  TranslateStaticLoader
} from 'ng2-translate';

import { AppComponent } from './app.component';
import { NavigationComponent } from './pages/navigation/navigation.component';
import { IndexComponent } from './pages/index/index.component';
import { router } from './app.router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WalletComponent } from './pages/evedata/wallet/wallet.component';
import { CharacterGuard } from './pages/evedata/character.guard';
import { Globals } from './globals';
import { AuthGuard } from './auth.guard';
import { AppGuard } from './app.guard';
import { Angular2FontawesomeModule } from 'angular2-fontawesome';
import { AssetsComponent } from './pages/evedata/assets/assets.component';
import { CharactersheetComponent } from './pages/evedata/charactersheet/charactersheet.component';
import { ContactsComponent } from './pages/evedata/contacts/contacts.component';
import { IndustryComponent } from './pages/evedata/industry/industry.component';
import { MailComponent } from './pages/evedata/mail/mail.component';
import { MarketComponent } from './pages/evedata/market/market.component';
import { PlanetsComponent } from './pages/evedata/planets/planets.component';
import { SkillsComponent } from './pages/evedata/skills/skills.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    IndexComponent,
    DashboardComponent,
    AssetsComponent,
    CharactersheetComponent,
    ContactsComponent,
    IndustryComponent,
    MailComponent,
    MarketComponent,
    SkillsComponent,
    PlanetsComponent,
    WalletComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [Http]
    }),
    router,
    Angular2FontawesomeModule
  ],
  providers: [
    {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
    CharacterGuard, Globals, AuthGuard, AppGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

export function createTranslateLoader(http: Http): TranslateStaticLoader {
  return new TranslateStaticLoader(http, '../assets/lang', '.json');
}

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    return 'some value';
  }
}
