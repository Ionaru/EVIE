import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OneComponent } from './one/one.component';
import { TwoComponent } from './two/two.component';
import { AppReadyEvent } from './app-ready.event';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from './models/user/user.service';
import { CharacterService } from './models/character/character.service';
import { EndpointService } from './models/endpoint/endpoint.service';
import { NavigationComponent } from './navigation/navigation.component';
import { StatusService } from './data-services/status.service';


@NgModule({
    declarations: [
        AppComponent,
        NavigationComponent,
        OneComponent,
        TwoComponent
    ],
    imports: [
        BrowserModule,
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
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
