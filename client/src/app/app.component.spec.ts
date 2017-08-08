import { getTestBed, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BaseRequestOptions, Http, HttpModule, XHRBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Logger } from 'angular2-logger/core';
import * as expect from 'must/register';
import { BsDropdownModule, ModalModule, TooltipModule } from 'ngx-bootstrap';
import { SinonStub, stub } from 'sinon';

import { AppComponent } from './app.component';
import { declarations } from './app.module';
import { IndexComponent } from './pages/core/index/index.component';
import { Globals } from './shared/globals';

// tslint:disable:only-arrow-functions space-before-function-paren

describe('AppComponent', () => {

  let logger: Logger;
  let loggerStub: SinonStub;

  beforeEach(async function () {
    this.timeout(10000);

    TestBed.configureTestingModule({
      declarations,
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpModule,
        RouterTestingModule.withRoutes([
          {
            component: IndexComponent,
            path: '',
          },
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
          deps: [MockBackend, BaseRequestOptions],
          provide: Http,
          useFactory: (backend: XHRBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backend, defaultOptions);
          },
        },
      ],
    });

    const testbed = getTestBed();

    logger = testbed.get(Logger);
    loggerStub = stub(logger, 'error');

  });

  afterEach(async function () {
    loggerStub.restore();
  });

  it('must create the app', async function () {
    this.timeout(10000);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).to.be.truthy();
  });
});
