import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { async, getTestBed, TestBed } from '@angular/core/testing';
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

@Component({
    selector: 'app-navigation',
    template: '<p>Mock Product Settings Component</p>',
})
class MockProductSettingsComponent {}

describe('AppComponent', () => {

    let injector: TestBed;
    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                AppComponent,
                MockProductSettingsComponent,
            ],
            imports: [
                RouterTestingModule,
                HttpClientTestingModule,
                NgbModule,
            ],
            providers: [
                { provide: UserService, useClass: MockUserService},
                AppReadyEventService,
                // HttpTestingController,
            ],
        }).compileComponents().then();

        injector = getTestBed();
        httpClient = TestBed.get(HttpClient);
        httpTestingController = TestBed.get(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should create the app', (done) => {
        const fixture = TestBed.createComponent(AppComponent);

        const req = httpTestingController.expectOne('api/handshake');
        fixture.whenStable().then(() => {
            const app = fixture.debugElement.componentInstance;
            // noinspection JSIgnoredPromiseFromCall
            expect(app).toBeTruthy();
            done();
        });

        expect(req.request.method).toEqual('GET');
        req.flush({
            message: 'NotLoggedIn',
            state: 'success',
        });
    });

    it(`should have a version`, (done) => {
        const fixture = TestBed.createComponent(AppComponent);

        const req = httpTestingController.expectOne('api/handshake');
        fixture.whenStable().then(() => {
            const app = fixture.debugElement.componentInstance;
            // noinspection JSIgnoredPromiseFromCall
            expect(app.version).toEqual('0.4.0-INDEV');
            done();
        });

        expect(req.request.method).toEqual('GET');
        req.flush({
            message: 'NotLoggedIn',
            state: 'success',
        });
    });

    it('should render the version in the version-tag', (done) => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            const compiled = fixture.debugElement.nativeElement;
            // noinspection JSIgnoredPromiseFromCall
            expect(compiled.querySelector('.version-tag').textContent).toContain('0.4.0-INDEV');
            done();
        });

        const req = httpTestingController.expectOne('api/handshake');
        expect(req.request.method).toEqual('GET');
        req.flush({
            message: 'NotLoggedIn',
            state: 'success',
        });
    });

    it('should fail the boot', (done) => {
        console.log('should fail the boot');

        const fixture = TestBed.createComponent(AppComponent);

        fixture.detectChanges();

        fixture.whenStable().then(() => {
            const compiled = fixture.debugElement.nativeElement;
            // noinspection JSIgnoredPromiseFromCall
            console.log(compiled.querySelectorAll('.version-tag'));
            expect(compiled.querySelectorAll('#error-info').textContent).toContain('0.4.0-INDEV');
            // expect(document.getElementById('error-info')).toContain('0.4.0-INDEV');
            // expect(document.getElementById('banner')).toBeTruthy();
            done();
        });

        const req = httpTestingController.expectOne('api/handshake');
        expect(req.request.method).toEqual('GET');
        req.flush({
            message: 'NotLoggedIn',
            state: 'error',
        }, {status: 500, statusText: 'Internal Server Error'});
    });

    // it('should fail the boot 2',  async(() => {
    //     const testData: any = {name: 'Test Data'};
    //     httpClient.get<any>('/data').subscribe((data) => expect(data).toEqual(testData));
    //
    //     // The following `expectOne()` will match the request's URL.
    //     // If no requests or multiple requests matched that URL
    //     // `expectOne()` would throw.
    //     const req = httpTestingController.expectOne('/data');
    //
    //     // Assert that the request is a GET.
    //     expect(req.request.method).toEqual('GET');
    //
    //     // Respond with mock data, causing Observable to resolve.
    //     // Subscribe callback asserts that correct data was returned.
    //     req.flush(testData);
    //
    //     // Finally, assert that there are no outstanding requests.
    //     httpTestingController.verify();
    //
    //
    //     // const fixture = TestBed.createComponent(AppComponent);
    //     // fixture.detectChanges();
    //     // expect(fixture.debugElement.nativeElement.querySelector('#error-info') === null).toEqual(true);
    //     // fixture.debugElement.componentInstance.boot().then(() => {
    //     //     console.log('hi');
    //     // });
    //     //
    //     // console.log(httpMock.constructor.name);
    //     // const req = httpMock.expectOne(`/handshake`);
    //     // expect(req.request.method).toBe('GET');
    //     // req.flush([]);
    //     //
    //     // fixture.whenStable().then(() => {
    //     //     fixture.detectChanges();
    //     //     expect(fixture.debugElement.nativeElement.querySelector('#error-info') === null).toEqual(false);
    //     // });
    //
    //     // const f = fixture.debugElement.componentInstance;
    //     // f.boot().then(() => {
    //     //     console.log('hi');
    //     //     expect(true).toBe(false);
    //     //     done();
    //     // }).catch(() => {
    //     //     done();
    //     // }));
    //     // const compiled = fixture.debugElement.nativeElement;
    //     // // noinspection JSIgnoredPromiseFromCall
    //     // console.log(compiled.querySelector('#error-info'));
    //     // expect(compiled.querySelector('#error-info').textContent).toContain('Error during app startup');
    // }));
});
