import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

import { AppReadyGuard, AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppReadyEvent } from './app-ready.event';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from './models/user/user.service';
import { CharacterService } from './models/character/character.service';
import { EndpointService } from './models/endpoint/endpoint.service';
import { NavigationComponent } from './navigation/navigation.component';
import { StatusService } from './data-services/status.service';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginModalComponent } from './pages/home/login-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RegisterModalComponent } from './pages/home/register-modal.component';


@NgModule({
    bootstrap: [
        AppComponent
    ],
    declarations: [
        AppComponent,
        NavigationComponent,
        HomeComponent,
        DashboardComponent,
        LoginModalComponent,
        RegisterModalComponent,
    ],
    entryComponents: [
        LoginModalComponent,
        RegisterModalComponent,
    ],
    imports: [
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        NgbModule.forRoot(),
    ],
    providers: [
        AppReadyEvent,
        UserService,
        CharacterService,
        EndpointService,
        StatusService,
        AppReadyGuard,
        // AuthGuard,
    ]
})
export class AppModule {
}
