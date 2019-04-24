import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { environment } from '../environments/environment';
import { AppReadyEventService } from './app-ready-event.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiOfflineMessageComponent } from './components/api-offline-message/api-offline-message.component';
import { NoScopesMessageComponent } from './components/no-scopes-message/no-scopes-message.component';
import { SorTableComponent } from './components/sor-table/sor-table.component';
import { AttributesService } from './data-services/attributes.service';
import { BlueprintsService } from './data-services/blueprints.service';
import { IndustryJobsService } from './data-services/industry-jobs.service';
import { IndustryService } from './data-services/industry.service';
import { MarketService } from './data-services/market.service';
import { NamesService } from './data-services/names.service';
import { ShipService } from './data-services/ship.service';
import { SkillGroupsService } from './data-services/skill-groups.service';
import { SkillQueueService } from './data-services/skillqueue.service';
import { SkillsService } from './data-services/skills.service';
import { StatusService } from './data-services/status.service';
import { StructuresService } from './data-services/structures.service';
import { TypesService } from './data-services/types.service';
import { UsersService } from './data-services/users.service';
import { WalletJournalService } from './data-services/wallet-journal.service';
import { WalletService } from './data-services/wallet.service';
import { AdminGuard } from './guards/admin.guard';
import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { httpInterceptorProviders } from './http-interceptors';
import { CharacterService } from './models/character/character.service';
import { UserService } from './models/user/user.service';
import { LogoutModalComponent } from './navigation/logout-modal.component';
import { NavigationComponent } from './navigation/navigation.component';
import { BlueprintCalculatorComponent } from './pages/blueprint-calculator/blueprint-calculator.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DataPageComponent } from './pages/data-page/data-page.component';
import { HomeComponent } from './pages/home/home.component';
import { IndustryCalculatorComponent } from './pages/industry-calculator/industry-calculator.component';
import { IndustryComponent } from './pages/industry/industry.component';
import { OreComponent } from './pages/ore/ore.component';
import { RefiningProfitComponent } from './pages/refining-profit/refining-profit.component';
import { ScopesComponent } from './pages/scopes/scopes.component';
import { SkillsComponent } from './pages/skills/skills.component';
import { UsersComponent } from './pages/users/users.component';
import { WalletComponent } from './pages/wallet/wallet.component';
import { SentryErrorHandler } from './sentry.error-handler';
import { ESIRequestCache } from './shared/esi-request-cache';
import { SocketService } from './socket/socket.service';

const errorHandlers = [];
if (environment.production) {
    errorHandlers.push({ provide: ErrorHandler, useClass: SentryErrorHandler });
}

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
        LogoutModalComponent,
        IndustryComponent,
        UsersComponent,
        OreComponent,
        SorTableComponent,
        ScopesComponent,
        NoScopesMessageComponent,
        ApiOfflineMessageComponent,
        BlueprintCalculatorComponent,
        RefiningProfitComponent,
        IndustryCalculatorComponent,
    ],
    entryComponents: [
        LogoutModalComponent,
    ],
    imports: [
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        NgbModule,
        NgbTooltipModule,
        FontAwesomeModule,
    ],
    providers: [
        ...errorHandlers,
        httpInterceptorProviders,
        ESIRequestCache,
        AppReadyEventService,
        UserService,
        UsersService,
        CharacterService,
        NamesService,
        StatusService,
        TypesService,
        ShipService,
        WalletService,
        WalletJournalService,
        AttributesService,
        SkillQueueService,
        SkillGroupsService,
        SkillsService,
        IndustryJobsService,
        BlueprintsService,
        IndustryService,
        StructuresService,
        MarketService,
        SocketService,
        AppReadyGuard,
        AuthGuard,
        AdminGuard,
    ],
})
export class AppModule {
}
