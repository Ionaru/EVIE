import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminGuard } from './guards/admin.guard';
import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { AboutComponent } from './pages/about/about.component';
import { AssetsComponent } from './pages/assets/assets.component';
import { OreContentsComponent } from './pages/ore-contents/ore-contents.component';
import { GasBoosterGasCloudsComponent } from './pages/prices-chart/gas-bgc.component';
import { GasFullerenesComponent } from './pages/prices-chart/gas-fullerenes.component';
import { IceComponent } from './pages/prices-chart/ice.component';
import { ProductionCalculatorComponent } from './pages/production-calculator/production-calculator.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { IndustryJobsComponent } from './pages/industry/jobs/industry-jobs.component';
import { IndustrySystemOverviewComponent } from './pages/industry/system-overview/industry-system-overview.component';
import { ReprocessingComponent } from './pages/reprocessing/reprocessing.component';
import { ScopesComponent } from './pages/scopes/scopes.component';
import { SkillsComponent } from './pages/skills/skills.component';
import { UsersComponent } from './pages/users/users.component';
import { WalletComponent } from './pages/wallet/wallet.component';
import { OreBeltComponent } from './pages/prices-chart/ore-belt.component';
import { OreMoonComponent } from './pages/prices-chart/ore-moon.component';
import { OreTrigComponent } from './pages/prices-chart/ore-trig.component';
import { IndustryComponent } from './pages/industry/industry.component';
import { RefiningProfitBeltComponent } from './pages/refining-profit/refining-profit-belt.component';
import { RefiningProfitMoonComponent } from './pages/refining-profit/refining-profit-moon.component';
import { RefiningProfitTrigComponent } from './pages/refining-profit/refining-profit-trig.component';

const routes: Routes = [
    // Public pages
    {path: '', component: HomeComponent, resolve: [AppReadyGuard]},
    {path: 'about', component: AboutComponent, resolve: [AppReadyGuard]},

    // EVE data pages.
    {
        path: 'prices', resolve: [AppReadyGuard],
        children: [
            {path: '', redirectTo: 'belt', pathMatch: 'full'},
            {path: 'belt', component: OreBeltComponent},
            {path: 'moon', component: OreMoonComponent},
            {path: 'triglavian', component: OreTrigComponent},
            {path: 'fullerenes', component: GasFullerenesComponent},
            {path: 'booster-gas-clouds', component: GasBoosterGasCloudsComponent},
            {path: 'ice', component: IceComponent},
            {path: 'triglavian', component: OreTrigComponent},
        ],
    },
    {path: 'ore', component: OreContentsComponent, resolve: [AppReadyGuard]},
    {path: 'production-calculator', component: ProductionCalculatorComponent, resolve: [AppReadyGuard]},
    {
        path: 'refining-profit', resolve: [AppReadyGuard], canActivate: [AdminGuard],
        children: [
            {path: '', redirectTo: 'belt', pathMatch: 'full'},
            {path: 'belt', component: RefiningProfitBeltComponent},
            {path: 'moon', component: RefiningProfitMoonComponent},
            {path: 'triglavian', component: RefiningProfitTrigComponent},
        ],
    },
    {path: 'reprocessing', component: ReprocessingComponent, resolve: [AppReadyGuard]},

    // Character data pages.
    {path: 'dashboard', component: DashboardComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'scopes', component: ScopesComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {
        path: 'industry', component: IndustryComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard],
        children: [
            {path: '', redirectTo: 'jobs', pathMatch: 'full'},
            {path: 'jobs', component: IndustryJobsComponent},
            {path: 'system-overview', component: IndustrySystemOverviewComponent},
        ],
    },
    {path: 'skills', component: SkillsComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'wallet', component: WalletComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'assets', component: AssetsComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},

    // Admin pages
    {path: 'users', component: UsersComponent, resolve: [AppReadyGuard], canActivate: [AdminGuard]},

    {path: '**', component: HomeComponent, resolve: [AppReadyGuard]},
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(routes)],
})
export class AppRoutingModule {
}
