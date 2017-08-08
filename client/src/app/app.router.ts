import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './pages/core/dashboard/dashboard.component';
import { IndexComponent } from './pages/core/index/index.component';
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

const routes: Routes = [
  {path: '', component: IndexComponent, resolve: [AppGuard]},
  {path: 'dashboard', component: DashboardComponent, resolve: [AppGuard], canActivate: [AuthGuard]},
  {path: 'charactersheet', component: CharactersheetComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  {path: 'skills', component: SkillsComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  {path: 'contacts', component: ContactsComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  {path: 'mail', component: MailComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  {path: 'market', component: MarketComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  {path: 'wallet', component: WalletComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  {path: 'assets', component: AssetsComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  {path: 'planets', component: PlanetsComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  {path: 'industry', component: IndustryComponent, resolve: [AppGuard, CharacterGuard], canActivate: [AuthGuard]},
  // {path: 'error', component: IndexComponent},
  {path: '**', redirectTo: ''},
];

export const router: ModuleWithProviders = RouterModule.forRoot(routes);
