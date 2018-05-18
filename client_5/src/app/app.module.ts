import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppReadyEvent } from './app-ready.event';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BalanceService } from './data-services/balance.service';
import { NamesService } from './data-services/names.service';
import { ShipService } from './data-services/ship.service';
import { StatusService } from './data-services/status.service';
import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { CharacterService } from './models/character/character.service';
import { UserService } from './models/user/user.service';
import { NavigationComponent } from './navigation/navigation.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginModalComponent } from './pages/home/login-modal.component';
import { RegisterModalComponent } from './pages/home/register-modal.component';
import { WalletComponent } from './pages/wallet/wallet.component';
import { SocketService } from './socket/socket.service';

@NgModule({
    bootstrap: [
        AppComponent,
    ],
    declarations: [
        AppComponent,
        NavigationComponent,
        HomeComponent,
        DashboardComponent,
        WalletComponent,
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
        NamesService,
        StatusService,
        ShipService,
        BalanceService,
        SocketService,
        AppReadyGuard,
        AuthGuard,
    ],
})
export class AppModule {
}
