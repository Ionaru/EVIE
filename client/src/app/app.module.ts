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
import { IndexComponent } from './pages/index/index.component';
import { router } from './app.router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WalletComponent } from './pages/evedata/wallet/wallet.component';
import { CharacterGuard } from './pages/evedata/character.guard';
import { Globals } from './globals';
import { AuthGuard } from './auth.guard';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    IndexComponent,
    DashboardComponent,
    WalletComponent,
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
    router,
  ],
  providers: [
    {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
    CharacterGuard, Globals, AuthGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

export function createTranslateLoader(http: Http): TranslateStaticLoader {
  return new TranslateStaticLoader(http, '../assets/lang', '.json');
}

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    return 'some value';
  }
}
