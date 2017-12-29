import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { OneComponent } from './one/one.component';
import { TwoComponent } from './two/two.component';
import { AppReadyEvent } from './app-ready.event';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from './models/user/user.service';


@NgModule({
  declarations: [
    AppComponent,
    OneComponent,
    TwoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [AppReadyEvent, UserService],
  bootstrap: [AppComponent]
})
export class AppModule { }
