import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IndexComponent } from './pages/core/index/index.component';
import { DashboardComponent } from './pages/core/dashboard/dashboard.component';
import { WalletComponent } from './pages/evedata/wallet/wallet.component';
import { CharacterGuard } from './pages/guards/character.guard';
import { AuthGuard } from './pages/guards/auth.guard';
import { AppGuard } from './pages/guards/app.guard';
// import { LoggedInGuard } from './pages/logged-in.guard';
// import { CharacterGuard } from './pages/evedata/character.guard';
import { IndustryComponent } from './pages/evedata/industry/industry.component';
import { PlanetsComponent } from './pages/evedata/planets/planets.component';
import { AssetsComponent } from './pages/evedata/assets/assets.component';
import { MarketComponent } from './pages/evedata/market/market.component';
import { MailComponent } from './pages/evedata/mail/mail.component';
import { ContactsComponent } from './pages/evedata/contacts/contacts.component';
import { SkillsComponent } from './pages/evedata/skills/skills.component';
import { CharactersheetComponent } from './pages/evedata/charactersheet/charactersheet.component';
// import { ApikeysComponent } from './pages/apikeys/apikeys.component';

const routes: Routes = [
  {path: '', component: IndexComponent, resolve: [AppGuard]},
  {path: 'dashboard', component: DashboardComponent, resolve: [AppGuard], canActivate: [AuthGuard]},
  // {path: 'api', component: ApikeysComponent},
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
  // {path: '**', component: IndexComponent},
];

export const router: ModuleWithProviders = RouterModule.forRoot(routes);
