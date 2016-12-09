import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IndexComponent } from './pages/index/index.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WalletComponent } from './pages/evedata/wallet/wallet.component';
import { CharacterGuard } from './pages/evedata/character.guard';
// import { LoggedInGuard } from './pages/logged-in.guard';
// import { CharacterGuard } from './pages/evedata/character.guard';
// import { IndustryComponent } from './pages/evedata/industry/industry.component';
// import { AccountComponent } from './pages/evedata/account/account.component';
// import { PlanetsComponent } from './pages/evedata/planets/planets.component';
// import { AssetsComponent } from './pages/evedata/assets/assets.component';
// import { MarketComponent } from './pages/evedata/market/market.component';
// import { MailComponent } from './pages/evedata/mail/mail.component';
// import { ContactsComponent } from './pages/evedata/contacts/contacts.component';
// import { SkillsComponent } from './pages/evedata/skills/skills.component';
// import { CharactersheetComponent } from './pages/evedata/charactersheet/charactersheet.component';
// import { ApikeysComponent } from './pages/apikeys/apikeys.component';

const routes: Routes = [
  {path: '', component: IndexComponent},
  {path: 'dashboard', component: DashboardComponent},
  // {path: 'api', component: ApikeysComponent},
  // {path: 'account', component: AccountComponent, canActivate: [CharacterGuard]},
  // {path: 'charactersheet', component: CharactersheetComponent, canActivate: [CharacterGuard]},
  // {path: 'skills', component: SkillsComponent, canActivate: [CharacterGuard]},
  // {path: 'contacts', component: ContactsComponent, canActivate: [CharacterGuard]},
  // {path: 'mail', component: MailComponent, canActivate: [CharacterGuard]},
  // {path: 'market', component: MarketComponent, canActivate: [CharacterGuard]},
  {path: 'wallet', component: WalletComponent, resolve: [CharacterGuard]},
  // {path: 'assets', component: AssetsComponent, canActivate: [CharacterGuard]},
  // {path: 'planets', component: PlanetsComponent, canActivate: [CharacterGuard]},
  // {path: 'industry', component: IndustryComponent, canActivate: [CharacterGuard]},
  // {path: 'error', component: IndexComponent},
  // {path: '**', component: IndexComponent},
];

export const router: ModuleWithProviders = RouterModule.forRoot(routes);
