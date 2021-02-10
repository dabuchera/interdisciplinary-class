import { Component, ViewChild, Inject, Optional, Input, OnInit, OnDestroy } from '@angular/core';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexFill,
  ApexLegend
} from 'ng-apexcharts';
import { MainComponent } from '../main/main.component';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  fill: ApexFill;
  legend: ApexLegend;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})

export class TimetableComponent implements OnInit, OnDestroy {

  @Input('MainComponent') mainComponent: MainComponent;

  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  @Input() injection: boolean;
  @Input() sendedSrc: string;

  loaded: boolean = true;
  Src: any;

  constructor(@Optional() @Inject('TimetableInjection') data) {
    if (data) {
      console.log(data);
      this.injection = data.injection;
      this.sendedSrc = data.sendedSrc;
    }
    this.Src = this.sendedSrc;
  }

  ngOnInit() {
    console.log('oninit');
    if (this.injection) {
      // Das obere ist dann das Richtige
      this.chartOptions = this.Src;
      console.log(this.Src);
      // this.srcString = '../../assets/pdfs/example.pdf';
    }
    else {
      console.log('ngOnInit + this.Src');
      console.log(this.Src);
      this.chartOptions = this.Src;
    }
  }

  ngOnDestroy() {
    console.log('destroy');
    this.loaded = false;
  }
}
