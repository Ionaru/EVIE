import { Injectable, NgModule } from '@angular/core';
import { Routes, RouterModule, Resolve } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { AppReadyEvent } from './app-ready.event';

@Injectable()
export class AppReadyGuard implements Resolve<boolean> {

    /**
     * Resolves if the app has started correctly.
     * */
    public resolve(): Observable<any> {
        if (AppReadyEvent.appReady) {
            return Observable.of(true);
        } else {
            return AppReadyEvent.appReadyEvent.asObservable();
        }
    }
}


const routes: Routes = [
    {path: '', component: HomeComponent, resolve: [AppReadyGuard]},
    {path: 'dashboard', component: DashboardComponent, resolve: [AppReadyGuard]},
    {path: '**', component: HomeComponent, resolve: [AppReadyGuard]},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
