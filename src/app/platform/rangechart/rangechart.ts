import { Component, ViewChild } from '@angular/core';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexFill,
  ApexLegend,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  fill: ApexFill;
  legend: ApexLegend;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
};

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css'],
// })
export class Rangechart {
  @ViewChild('chart') chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  public _viewer: Autodesk.Viewing.Viewer3D;

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Formwork',
          data: [
            {
              x: '1 Floor',
              y: [0, 4],
            },
            {
              x: '2 floor',
              y: [4, 8],
            },
            {
              x: '3 Floor',
              y: [8, 12],
            },
            {
              x: '4 Floor',
              y: [12, 16],
            },
          ],
        },
        {
          name: 'Reinforcement',
          data: [
            {
              x: '1 Floor',
              y: [4, 8],
            },
            {
              x: '2 floor',
              y: [8, 12],
            },
            {
              x: '3 Floor',
              y: [12, 16],
            },
            {
              x: '4 Floor',
              y: [16, 20],
            },
          ],
        },
        {
          name: 'Concrete',
          data: [
            {
              x: '1 Floor',
              y: [8, 12],
            },
            {
              x: '2 floor',
              y: [12, 16],
            },
            {
              x: '3 Floor',
              y: [16, 20],
            },
            {
              x: '4 Floor',
              y: [20, 24],
            },
          ],
        },
      ],
      chart: {
        height: 450,
        type: 'rangeBar',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '80%',
        },
      },
      xaxis: {
        type: 'datetime',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.25,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [50, 0, 100, 100],
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
      },
    };
  }
}
