import * as Chart from 'chart.js';
import { DashboardPanelChart } from './DashboardPanel';
import { Zone } from '../zones/zone';

export class BarChart extends DashboardPanelChart {
  public propertyToUse: any;
  public chart: Chart;
  // public wdToUse: any;
  public _view: any;
  public zones: Zone[];

  // constructor() {
  //   super();
  //   // this.wdToUse = wd;
  // }
  constructor(property, zones) {
    super();
    this.propertyToUse = property;
    this.zones = zones;
  }

  // load(parentDivId, viewer, zonesData) {
  //   if (
  //     !super.loadwithData(parentDivId, this.constructor.name, viewer, zonesData)
  //   )
  //     return;
  //   this.drawChart();
  // }
  // drawChart() {
  //   var _this = this; // need this for the onClick event

  //   // @ts-ignore
  //   var ctx = document.getElementById(this.canvasId).getContext('2d');
  //   console.log(ctx);
  //   var colors = this.generateColors(this.zonesData.label.length);
  //   // console.log(this.zonesData.getCountInstances(this.wdToUse));

  //   // _this.zonesData.getIds(_this.wdToUse, ctx[0]._zones.label);

  //   new Chart(ctx, {
  //     type: 'bar',
  //     data: {
  //       labels: this.zonesData.getLabels(),
  //       datasets: [
  //         {
  //           data: this.zonesData.wdData,
  //           backgroundColor: colors.background,
  //           borderColor: colors.borders,
  //           borderWidth: 1,
  //         },
  //       ],
  //     },
  //     options: {
  //       scales: {
  //         yAxes: [
  //           {
  //             ticks: {
  //               beginAtZero: true,
  //             },
  //           },
  //         ],
  //       },
  //       legend: {
  //         display: false,
  //       },
  //       onClick: function (evt, item) {
  //         // console.log(item);
  //         // _this.viewer.isolate(
  //         // _this.zonesData.getIds(_this.propertyToUse, item[0]._zones.label);
  //         // );
  //       },
  //     },
  //   });
  // }

  ////////////////////EXAMPLE///////////////////

  load(parentDivId, viewer, modelData) {
    if (
      !super.loadwithData(parentDivId, this.constructor.name, viewer, modelData)
    )
      return;
    this.drawChart();
  }

  drawChart() {
    var _this = this; // need this for the onClick event

    // @ts-ignore
    var ctx = document.getElementById(this.canvasId).getContext('2d');
    console.log(ctx);
    var colors = this.generateColors(
      this.modelData.getLabels(this.propertyToUse).length
    );
    // console.log(this.modelData.getCountInstances(this.propertyToUse));

    // _this.modelData.getIds(_this.propertyToUse, ctx[0]._model.label);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        // labels: this.modelData.getLabels(this.propertyToUse),
        labels: [],
        datasets: [
          {
            label: 'Install Formwork',
            // data: this.modelData.getCountInstances(this.propertyToUse),
            data: [],

            backgroundColor: colors.background,
            borderColor: colors.borders,
            borderWidth: 1,
          },
          {
            label: 'Install Reinforcement',
            // data: this.modelData.getCountInstances(this.propertyToUse),
            data: [],

            backgroundColor: colors.background,
            borderColor: colors.borders,
            borderWidth: 1,
          },
          {
            label: 'Pour Concrete',
            // data: this.modelData.getCountInstances(this.propertyToUse),
            data: [],

            backgroundColor: colors.background,
            borderColor: colors.borders,
            borderWidth: 1,
          },
          {
            label: 'Curing',
            // data: this.modelData.getCountInstances(this.propertyToUse),
            data: [],

            backgroundColor: colors.background,
            borderColor: colors.borders,
            borderWidth: 1,
          },
          {
            label: 'Strip Formwork',
            // data: this.modelData.getCountInstances(this.propertyToUse),
            data: [],

            backgroundColor: colors.background,
            borderColor: colors.borders,
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
        legend: {
          display: true,
        },
        // events: ['click'], // if you want to have the chart only respond to click events
        onClick: function (evt) {
          // console.log(evt);
          // console.log(item[0]);
          var activeZoneLabel = this.getElementsAtEvent(evt)[0]._model.label;
          console.log(activeZoneLabel);

          console.log(_this.zones);
          var correspondingZone = _this.zones.find((obj) => {
            return obj.id === activeZoneLabel;
          });
          console.log(correspondingZone.dbIds);
          _this.viewer.isolate(correspondingZone.dbIds);
          // _this.viewer.isolate(
          // _this.modelData.getIds(_this.propertyToUse, item[0]._model.label);
          // );
        },
      },
    });
  }
}
