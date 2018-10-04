import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppReadyEventService } from './app-ready-event.service';
import { AppComponent } from './app.component';
import { UserService } from './models/user/user.service';

class MockUserService {
    public storeUser() {
        // Empty
    }
}

describe('AppComponent', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
            ],
            imports: [
                RouterTestingModule,
                HttpClientTestingModule,
                NgbModule,
            ],
            providers: [
                { provide: UserService, useClass: MockUserService},
                AppReadyEventService,
                HttpTestingController,
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents().then();
    }));
    it('should create the app', async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        // noinspection JSIgnoredPromiseFromCall
        expect(app).toBeTruthy();
    }));
    it(`should have a version`, async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        // noinspection JSIgnoredPromiseFromCall
        expect(app.version).toEqual('0.3.0-INDEV');
    }));
    it('should render the version in the version-tag', async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        // noinspection JSIgnoredPromiseFromCall
        expect(compiled.querySelector('.version-tag').textContent).toContain('0.3.0-INDEV');
    }));
});
