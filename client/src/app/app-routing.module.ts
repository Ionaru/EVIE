import { Injectable, NgModule } from '@angular/core';
import { CanActivate, Resolve, Router, RouterModule, Routes } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AppReadyEvent } from './app-ready.event';
import { UserService } from './models/user/user.service';
import { Observer } from 'rxjs/Observer';

@Injectable()
export class AppReadyGuard implements Resolve<boolean> {

    /**
     * Resolves if the app has started correctly.
     * */
    public resolve(): Observable<any> {
        if (AppReadyEvent.appReady) {
            return Observable.of(true);
        } else {
            return AppReadyEvent.appReadyEvent;
        }
    }
}

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private router: Router) { }

    public canActivate(): Observable<boolean> | boolean {
        if (AppReadyEvent.appReady) {
            if (UserService.user) {
                return true;
            } else {
                this.router.navigate(['/']).then();
                return false;
            }
        } else {
            return Observable.create((observer: Observer<boolean>) => {
                AppReadyEvent.appReadyEvent.subscribe(() => {
                    if (UserService.user) {
                        observer.next(true);
                        observer.complete();
                    } else {
                        this.router.navigate(['/']).then();
                        observer.next(false);
                        observer.complete();
                    }
                });
            });
        }
    }
}

const routes: Routes = [
    {path: '', component: HomeComponent, resolve: [AppReadyGuard]},
    {path: 'dashboard', component: DashboardComponent, resolve: [AppReadyGuard], canActivate: [AuthGuard]},
    {path: '**', component: HomeComponent, resolve: [AppReadyGuard]},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
