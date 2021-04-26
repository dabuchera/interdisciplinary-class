import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PlatformModule } from './platform/platform.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ProgressSpinnerModule,
    PlatformModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
