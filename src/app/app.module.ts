import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AlertModule } from './_alert';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChartsModule } from 'ng2-charts';
import { NgApexchartsModule } from 'ng-apexcharts';

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PlatformModule } from './platform/platform.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    ProgressSpinnerModule,
    PlatformModule,
    AlertModule,
    ChartsModule,
    NgApexchartsModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
