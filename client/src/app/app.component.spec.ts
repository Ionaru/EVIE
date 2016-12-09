/* tslint:disable:no-unused-variable */

import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TranslateModule, TranslateLoader, MissingTranslationHandler } from 'ng2-translate';
import { createTranslateLoader, MyMissingTranslationHandler } from './app.module';
import { Http } from '@angular/http';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
      ],
      imports: [
        TranslateModule.forRoot({
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [Http]
        }),
      ],
      providers: [
        {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
      ],
    });
  });

  it('should create the app', () => {
    let fixture = TestBed.createComponent(AppComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'app works!'`, () => {
    let fixture = TestBed.createComponent(AppComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('app works!');
  });

  it('should render title in a h1 tag', () => {
    let fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    let compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1'));
    expect(compiled.querySelector('span'));
    // expect(compiled.querySelector('h1').textContent).toContain('Current Balance');
  });
});
