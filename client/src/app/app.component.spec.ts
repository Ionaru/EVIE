import { TestBed, getTestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NavigationComponent } from './pages/core/navigation/navigation.component';
import { IndexComponent } from './pages/core/index/index.component';
import { DashboardComponent } from './pages/core/dashboard/dashboard.component';
import { AssetsComponent } from './pages/evedata/assets/assets.component';
import { CharactersheetComponent } from './pages/evedata/charactersheet/charactersheet.component';
import { ContactsComponent } from './pages/evedata/contacts/contacts.component';
import { IndustryComponent } from './pages/evedata/industry/industry.component';
import { MailComponent } from './pages/evedata/mail/mail.component';
import { MarketComponent } from './pages/evedata/market/market.component';
import { SkillsComponent } from './pages/evedata/skills/skills.component';
import { PlanetsComponent } from './pages/evedata/planets/planets.component';
import { WalletComponent } from './pages/evedata/wallet/wallet.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BaseRequestOptions, Http, HttpModule, XHRBackend } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { Globals } from './shared/globals';
import { MockBackend } from '@angular/http/testing';
import * as expect from 'must/register';
import { Logger } from 'angular2-logger/core';
import { SinonStub, stub } from 'sinon';
import { LoginModalComponent } from './pages/core/index/login-modal.component';
import { RegisterModalComponent } from './pages/core/index/register-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule, ModalModule, TooltipModule } from 'ngx-bootstrap';

describe('AppComponent', () => {

  let logger: Logger;
  let loggerStub: SinonStub;

  beforeEach(async function() {

    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        NavigationComponent,
        IndexComponent,
        DashboardComponent,
        AssetsComponent,
        CharactersheetComponent,
        ContactsComponent,
        IndustryComponent,
        MailComponent,
        MarketComponent,
        SkillsComponent,
        PlanetsComponent,
        WalletComponent,
        LoginModalComponent,
        RegisterModalComponent,
      ],
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpModule,
        RouterTestingModule.withRoutes([
          {
            path: '',
            component: IndexComponent
          }
        ]),
        BsDropdownModule.forRoot(),
        TooltipModule.forRoot(),
        ModalModule.forRoot(),
      ],
      providers: [Globals,
        MockBackend,
        BaseRequestOptions,
        Logger,
        {
          provide: Http,
          deps: [MockBackend, BaseRequestOptions],
          useFactory: (backend: XHRBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backend, defaultOptions);
          }
        }
      ]
    });

    const testbed = getTestBed();

    logger = testbed.get(Logger);
    loggerStub = stub(logger, 'error');

  });

  afterEach(async function() {
    loggerStub.restore();
  });

  it('must create the app', async function() {
    this.timeout(10000);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).to.be.truthy();
  });
});
