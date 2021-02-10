import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';
import { ViewerModule } from '../viewer/viewer.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TimetableComponent } from './timetable/timetable.component';



@NgModule({
  declarations: [MainComponent, TimetableComponent],
  imports: [
    CommonModule,
    ViewerModule,
    NgApexchartsModule,
  ],
  exports: [MainComponent]
})
export class PlatformModule { }
