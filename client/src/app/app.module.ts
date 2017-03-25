import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

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
import { AssetsComponent } from './pages/evedata/assets/assets.component';
import { CharactersheetComponent } from './pages/evedata/charactersheet/charactersheet.component';
import { ContactsComponent } from './pages/evedata/contacts/contacts.component';
import { IndustryComponent } from './pages/evedata/industry/industry.component';
import { MailComponent } from './pages/evedata/mail/mail.component';
import { MarketComponent } from './pages/evedata/market/market.component';
import { PlanetsComponent } from './pages/evedata/planets/planets.component';
import { SkillsComponent } from './pages/evedata/skills/skills.component';
import { Logger } from 'angular2-logger/core';

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
    router,
  ],
  providers: [
    AppGuard,
    AuthGuard,
    CharacterGuard,
    Globals,
    Logger
  ],
  bootstrap: [
    AppComponent,
  ]
})
export class AppModule { }
