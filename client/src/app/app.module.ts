import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { AppReadyEventService } from './app-ready-event.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NamesService } from './data-services/names.service';
import { ShipService } from './data-services/ship.service';
import { SkillGroupsService } from './data-services/skill-groups.service';
import { SkillQueueService } from './data-services/skillqueue.service';
import { SkillsService } from './data-services/skills.service';
import { StatusService } from './data-services/status.service';
import { TypesService } from './data-services/types.service';
import { WalletJournalService } from './data-services/wallet-journal.service';
import { WalletService } from './data-services/wallet.service';
import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { httpInterceptorProviders } from './http-interceptors';
import { CharacterService } from './models/character/character.service';
import { UserService } from './models/user/user.service';
import { LogoutModalComponent } from './navigation/logout-modal.component';
import { NavigationComponent } from './navigation/navigation.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DataPageComponent } from './pages/data-page/data-page.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginModalComponent } from './pages/home/login-modal.component';
import { RegisterModalComponent } from './pages/home/register-modal.component';
import { IndustryComponent } from './pages/industry/industry.component';
import { SkillsComponent } from './pages/skills/skills.component';
import { WalletComponent } from './pages/wallet/wallet.component';
import { ESIRequestCache } from './shared/esi-request-cache';
import { SocketService } from './socket/socket.service';

@NgModule({
    bootstrap: [
        AppComponent,
    ],
    declarations: [
        AppComponent,
        NavigationComponent,
        HomeComponent,
        DataPageComponent,
        DashboardComponent,
        WalletComponent,
        SkillsComponent,
        LoginModalComponent,
        LogoutModalComponent,
        RegisterModalComponent,
        IndustryComponent,
    ],
    entryComponents: [
        LoginModalComponent,
        LogoutModalComponent,
        RegisterModalComponent,
    ],
    imports: [
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        NgbModule.forRoot(),
        NgbTooltipModule,
        // FontAwesomeModule,
    ],
    providers: [
        httpInterceptorProviders,
        ESIRequestCache,
        AppReadyEventService,
        UserService,
        CharacterService,
        NamesService,
        StatusService,
        TypesService,
        ShipService,
        WalletService,
        WalletJournalService,
        SkillQueueService,
        SkillGroupsService,
        SkillsService,
        SocketService,
        AppReadyGuard,
        AuthGuard,
    ],
})
export class AppModule {
}
