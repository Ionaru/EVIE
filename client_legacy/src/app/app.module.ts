import { HttpClientModule } from '@angular/common/http';
import { NgModule, Provider } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { Logger, Options } from 'angular2-logger/core';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.router';
import { DashboardComponent } from './pages/core/dashboard/dashboard.component';
import { IndexComponent } from './pages/core/index/index.component';
import { LoginModalComponent } from './pages/core/index/login-modal.component';
import { RegisterModalComponent } from './pages/core/index/register-modal.component';
import { NavigationComponent } from './pages/core/navigation/navigation.component';
import { AssetsComponent } from './pages/evedata/assets/assets.component';
import { CharactersheetComponent } from './pages/evedata/charactersheet/charactersheet.component';
import { ContactsComponent } from './pages/evedata/contacts/contacts.component';
import { IndustryComponent } from './pages/evedata/industry/industry.component';
import { MailComponent } from './pages/evedata/mail/mail.component';
import { MarketComponent } from './pages/evedata/market/market.component';
import { PlanetsComponent } from './pages/evedata/planets/planets.component';
import { SkillsComponent } from './pages/evedata/skills/skills.component';
import { WalletComponent } from './pages/evedata/wallet/wallet.component';
import { AppGuard } from './pages/guards/app.guard';
import { AuthGuard } from './pages/guards/auth.guard';
import { CharacterGuard } from './pages/guards/character.guard';
import { Globals } from './shared/globals';

export const declarations: any[] = [
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
  LoginModalComponent,
  RegisterModalComponent,
];

export const imports: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  FormsModule,
  HttpModule,
  HttpClientModule,
  AppRoutingModule,
  BsDropdownModule.forRoot(),
  TooltipModule.forRoot(),
  ModalModule.forRoot(),
];

export const providers: Provider[] = [
  AppGuard,
  AuthGuard,
  CharacterGuard,
  Globals,
  // Logger,
  // {provide: Options, useValue: {level: environment.logLevel}},
];

export const bootstrap: any[] = [
  AppComponent,
];

@NgModule({declarations, imports, providers, bootstrap})
export class AppModule {}
