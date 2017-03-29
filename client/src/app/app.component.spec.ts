/* tslint:disable:no-unused-variable */

import { TestBed, async, getTestBed } from '@angular/core/testing';
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
import { expect } from 'chai';
import { Logger } from 'angular2-logger/core';
import { SinonStub, stub } from 'sinon';

describe('AppComponent', () => {

  let logger: Logger;
  let loggerStub: SinonStub;

  beforeEach(async function() {
    this.timeout(10000);

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
      ],
      imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        RouterTestingModule.withRoutes([
          {
            path: '',
            component: IndexComponent
          }
        ]),
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

  it('should create the app', async function() {
    this.timeout(10000);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    console.error(app);
    expect(app).to.be.ok;
  });
});
