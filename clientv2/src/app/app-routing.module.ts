import { Injectable, NgModule } from '@angular/core';
import { Resolve, RouterModule, Routes } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
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

// @Injectable()
// export class AuthGuard implements CanActivate {
//
//     constructor(private router: Router) { }
//
//     public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
//         if (AppReadyEvent.appReady) {
//             console.log('ready');
//             if (UserService.user) {
//                 return true;
//             } else {
//                 this.router.navigate(['/']).then();
//                 return false;
//             }
//         } else {
//             return Observable.create((observer: Observer<boolean>) => {
//                 console.log('Observable');
//                 AppReadyEvent.appReadyEvent.subscribe(() => {
//                     console.log('ready');
//                     console.log(UserService.user);
//                     if (UserService.user) {
//                         console.log('yes');
//                         observer.next(true);
//                         observer.complete();
//                     } else {
//                         console.log('no');
//                         this.router.navigate(['/']).then();
//                         observer.next(false);
//                         observer.complete();
//                     }
//                 });
//             });
//         }
//     }
// }

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
