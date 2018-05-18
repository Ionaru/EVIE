import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { WalletComponent } from './pages/wallet/wallet.component';

const routes: Routes = [
    {path: '', component: HomeComponent, resolve: [AppReadyGuard]},
    {path: 'dashboard', component: DashboardComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: 'wallet', component: WalletComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: '**', component: HomeComponent, resolve: [AppReadyGuard]},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {
}
