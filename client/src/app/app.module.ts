import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, Http } from '@angular/http';
import {
  TranslateModule,
  TranslateLoader,
  TranslateStaticLoader,
  MissingTranslationHandler,
  MissingTranslationHandlerParams
} from 'ng2-translate';

import { AppComponent } from './app.component';
import { NavigationComponent } from './pages/navigation/navigation.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [Http]
    }),
  ],
  providers: [
    {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function createTranslateLoader(http: Http) {
  return new TranslateStaticLoader(http, '../assets/lang', '.json');
}

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    return 'some value';
  }
}
