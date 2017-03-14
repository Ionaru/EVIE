/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NavigationComponent } from './pages/navigation/navigation.component';
import { IndexComponent } from './pages/index/index.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
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
import { Angular2FontawesomeModule } from 'angular2-fontawesome';
import { BaseRequestOptions, Http, HttpModule, XHRBackend } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { Globals } from './globals';
import { MockBackend } from '@angular/http/testing';
import { expect } from 'chai';

describe('AppComponent', () => {
  beforeEach(() => {
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
        Angular2FontawesomeModule,
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
        {
          provide: Http,
          deps: [MockBackend, BaseRequestOptions],
          useFactory: (backend: XHRBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backend, defaultOptions);
          }
        }
      ]
    });
    TestBed.compileComponents().then();
  });

  it('should create the app', async(function() {
    this.timeout(5000);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).to.be.ok;
  }));

  // it(`should have as title 'app works!'`, async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   const app = fixture.debugElement.componentInstance;
  //   expect(app.title).to.equal('app works!');
  // }));
  //
  // it('should render title in a h1 tag', async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   expect(compiled.querySelector('h1').textContent).to.contain('Welcome to EVE-Track');
  // }));
});
