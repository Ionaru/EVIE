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
import { LoadingMessageComponent } from './components/loading-message/loading-message.component';
import { NoScopesMessageComponent } from './components/no-scopes-message/no-scopes-message.component';
import { SorTableComponent } from './components/sor-table/sor-table.component';
import { AssetsService } from './data-services/assets.service';
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
import { StationsService } from './data-services/stations.service';
import { StatusService } from './data-services/status.service';
import { StructuresService } from './data-services/structures.service';
import { SystemsService } from './data-services/systems.service';
import { TypesService } from './data-services/types.service';
import { UsersService } from './data-services/users.service';
import { WalletJournalService } from './data-services/wallet-journal.service';
import { WalletService } from './data-services/wallet.service';
import { AdminGuard } from './guards/admin.guard';
import { AppReadyGuard } from './guards/app-ready.guard';
import { AuthGuard } from './guards/auth.guard';
import { httpInterceptorProviders } from './http-interceptors';
import { LogoutModalComponent } from './modals/logout/logout-modal.component';
import { CharacterService } from './models/character/character.service';
import { UserService } from './models/user/user.service';
import { NavigationComponent } from './navigation/navigation.component';
import { AboutComponent } from './pages/about/about.component';
import { AssetsComponent } from './pages/assets/assets.component';
import { BlueprintCalculatorComponent } from './pages/blueprint-calculator/blueprint-calculator.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DataPageComponent } from './pages/data-page/data-page.component';
import { GasChartComponent } from './pages/gas-chart/gas-chart.component';
import { HomeComponent } from './pages/home/home.component';
import { IndustryComponent } from './pages/industry/industry.component';
import { IndustryJobsComponent } from './pages/industry/jobs/industry-jobs.component';
import { IndustrySystemOverviewComponent } from './pages/industry/system-overview/industry-system-overview.component';
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
    errorHandlers.push({provide: ErrorHandler, useClass: SentryErrorHandler});
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
        IndustryJobsComponent,
        IndustrySystemOverviewComponent,
        UsersComponent,
        OreComponent,
        SorTableComponent,
        ScopesComponent,
        NoScopesMessageComponent,
        ApiOfflineMessageComponent,
        BlueprintCalculatorComponent,
        RefiningProfitComponent,
        GasChartComponent,
        LoadingMessageComponent,
        AssetsComponent,
        AboutComponent,
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
        StationsService,
        SystemsService,
        MarketService,
        SocketService,
        AssetsService,
        AppReadyGuard,
        AuthGuard,
        AdminGuard,
    ],
})
export class AppModule {
}
