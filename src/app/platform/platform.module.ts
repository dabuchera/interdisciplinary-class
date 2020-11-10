import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { ViewerModule } from '../viewer/viewer.module';



@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    ViewerModule
  ],
  exports: [MainComponent]
})
export class PlatformModule { }
