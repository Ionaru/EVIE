import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminGuard } from './guards/admin.guard';
import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { AboutComponent } from './pages/about/about.component';
import { AssetsComponent } from './pages/assets/assets.component';
import { ProductionCalculatorComponent } from './pages/production-calculator/production-calculator.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { GasChartComponent } from './pages/gas-chart/gas-chart.component';
import { HomeComponent } from './pages/home/home.component';
import { IndustryJobsComponent } from './pages/industry/jobs/industry-jobs.component';
import { IndustrySystemOverviewComponent } from './pages/industry/system-overview/industry-system-overview.component';
import { ScopesComponent } from './pages/scopes/scopes.component';
import { SkillsComponent } from './pages/skills/skills.component';
import { UsersComponent } from './pages/users/users.component';
import { WalletComponent } from './pages/wallet/wallet.component';
import { OreBeltComponent } from './pages/ore/ore-belt.component';
import { OreMoonComponent } from './pages/ore/ore-moon.component';
import { OreTrigComponent } from './pages/ore/ore-trig.component';
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
        path: 'ore', resolve: [AppReadyGuard],
        children: [
            {path: '', redirectTo: 'belt', pathMatch: 'full'},
            {path: 'belt', component: OreBeltComponent},
            {path: 'moon', component: OreMoonComponent},
            {path: 'triglavian', component: OreTrigComponent},
        ],
    },
    {path: 'gas', component: GasChartComponent, resolve: [AppReadyGuard]},
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
