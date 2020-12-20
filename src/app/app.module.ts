import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AlertModule } from './_alert';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {ChartsModule} from 'ng2-charts'

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PlatformModule } from './platform/platform.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    ProgressSpinnerModule,
    PlatformModule,
    AlertModule,
    ChartsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
