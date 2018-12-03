import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminGuard } from './guards/admin.guard';
import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { IndustryComponent } from './pages/industry/industry.component';
import { OreComponent } from './pages/ore/ore.component';
import { ScopesComponent } from './pages/scopes/scopes.component';
import { SkillsComponent } from './pages/skills/skills.component';
import { UsersComponent } from './pages/users/users.component';
import { WalletComponent } from './pages/wallet/wallet.component';

const routes: Routes = [
    {path: '', component: HomeComponent, resolve: [AppReadyGuard]},

    // EVE data pages.
    {path: 'ore', component: OreComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'dashboard', component: DashboardComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'scopes', component: ScopesComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'industry', component: IndustryComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'skills', component: SkillsComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'wallet', component: WalletComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'users', component: UsersComponent, resolve: [AppReadyGuard], canActivate: [AdminGuard]},

    {path: '**', component: HomeComponent, resolve: [AppReadyGuard]},
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(routes)],
})
export class AppRoutingModule {
}
