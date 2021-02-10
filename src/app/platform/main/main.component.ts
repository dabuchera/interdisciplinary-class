import { Component, OnInit, Input, ViewChild, Injector, ComponentFactoryResolver } from '@angular/core';
import { AppComponent } from 'src/app/app.component';

import { CoordinatesAxesExtension } from '../extensions/coordinatesAxesExtension';

import {
  ViewerOptions,
  ViewerInitializedEvent,
  DocumentChangedEvent,
  ViewerComponent,
} from '../../viewer/component/viewer.component';

import {
  SelectionChangedEventArgs,
  // ExtensionLoadedEventArgs, Mal ausprobiert mit dem ExtensionLoaded Event
  Extension,
  ObjectTreeCreatedEventArgs,
  IsolateEventArgs,
} from '../../viewer/extensions/extension';
import { Element } from '../models/element';
import { Slab } from '../models/slab';
import { Wall } from '../models/wall';
import { Column } from '../models/column';
import { Foundation } from '../models/foundation';
import { Zone } from '../zones/zone';

import { AuthToken } from 'forge-apis';
import { ApiService } from 'src/app/_services/api.service';
import { Dashboard } from '../dashboard/Dashboard';
<<<<<<< HEAD
import * as jsPDF from 'jspdf';
=======
import { TimetableComponent } from '../timetable/timetable.component';
>>>>>>> d03d98cc36170cd5324597c63019d8a27e8151e5

import * as $ from 'jquery';
declare var THREE: any;

import { Utils } from '../../utils';

import html from './legendTemplate.html';
import { BarChart } from '../dashboard/PanelBarChart';
import { LeanBoxesExtension } from '../extensions/leanBoxes';
import { unescapeIdentifier } from '@angular/compiler';
// import Rangechart from ../rangechart/Rangechart;

// Function for async forEach
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

import inputHTML from './inputPanel.html';

import initialInputHTML from './initialInputPanel.html';
import { Rangechart } from '../rangechart/rangechart';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit {
  @Input() app: AppComponent;

  public viewerOptions3d: ViewerOptions;
  public encodedmodelurn: string;

  // Graphical Stuff
  public toolbarLevels: Autodesk.Viewing.UI.ToolBar;
  public toolbarConcrete: Autodesk.Viewing.UI.ToolBar;
  public toolbarEtappen: Autodesk.Viewing.UI.ToolBar;

  public inputPanel: Autodesk.Viewing.UI.DockingPanel;
<<<<<<< HEAD
  public initialInputPanel: Autodesk.Viewing.UI.DockingPanel;
=======
  public timetablePanel: Autodesk.Viewing.UI.DockingPanel;
>>>>>>> d03d98cc36170cd5324597c63019d8a27e8151e5

  public isolatedNodesConcrete: number[] = new Array();
  public isolatedNodesLevels: number[] = new Array();
  public isolatedNodesEtappen: number[] = new Array();

  // Model stuff
  public objectsPerLevel: any[] = new Array();
  public slabDbIds: any[] = new Array();
  public wallDbIds: any[] = new Array();
  public slabsPerLevel: any[] = new Array();
  public slabsToBeSplit: any[] = new Array();
  public wallsPerLevel: any[] = new Array();
  public wallsToBeSplit: any[] = new Array();
  public concrObj: any[] = new Array();
  public walls: Wall[] = new Array();
  public slabs: Slab[] = new Array();
  public columns: Column[] = new Array();
  public foundations: Foundation[] = new Array();
  leafcomponents = [];
  public zones: Zone[] = new Array();
  public allZones: Zone[] = new Array();
  public panel: Autodesk.Viewing.UI.DockingPanel;
  public tradeBarchart: BarChart;
  public allTradesBarchart: BarChart;
  public testchart: Rangechart;
  public etapObjects: any[] = new Array();

  // Show Timetable **************************************************************************
  public componentRef: any;

  @ViewChild(ViewerComponent, { static: false })
  viewerComponent: ViewerComponent;

  constructor(private api: ApiService, private componentFactoryResolver: ComponentFactoryResolver) {
    // this.api.getspecificProject('5faa62b2079c07001454c421').then((res) => {
    //   this.encodedmodelurn = res.encodedmodelurn;
    // });
    this.encodedmodelurn =
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDIxLTAyLTA0LTEzLTExLTMxLWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL0VTQi1TQlpfVE0tQXJiZWl0c3ZlcnNpb24uaWZj';
    // 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDIxLTAyLTAzLTA4LTUzLTMxLWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlLyVDMyU4OFNCLVNCWl9UTS1BcmJlaXRzdmVyc2lvbi5pZmM=';
    // 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDIxLTAxLTE1LTEzLTA1LTI4LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL2hidF8yMTAxMDVfMTQyOC1TQlowMF9BcmNoaXRla3R1ci5pZmM=';
    this.viewerOptions3d = {
      initializerOptions: {
        env: 'AutodeskProduction',
        getAccessToken: async (onGetAccessToken) => {
          const authToken: AuthToken = await this.api
            .get2LToken()
            .then((res) => {
              return res.access_token;
            });
          onGetAccessToken(authToken, 30 * 60);
        },
        api: 'derivativeV2',
      },
      viewerConfig: {
        // IconMarkupExtension wird bei onViewerInitialized geladen
        extensions: [
          'Autodesk.Snapping',
          'Autodesk.ModelStructure',
          // LeanBoxesExtension.extensionName,

          // CoordinatesAxesExtension.extensionName,
        ],
        // ,'GetPositionExtension'], //[IconMarkupExtension.extensionName], // [GetParameterExtension.extensionName],
        theme: 'dark-theme',
      },
      onViewerScriptsLoaded: this.scriptsLoaded,
      onViewerInitialized: async (args: ViewerInitializedEvent) => {
        console.log(this.encodedmodelurn);
        if (this.encodedmodelurn) {
          args.viewerComponent.DocumentId = this.encodedmodelurn;
        }
        // Hide container where model is in
        // Will be shown after runDifferentFunc()
        $('canvas').hide();
        this.replaceSpinner();
        $('.lds-roller').show();
        // this.app.openSpinner();
        this.loadLevelToolbar();
        this.loadConcreteToolbar();
        this.loadPropInputToolbar();
        this.loadZoneToolbar();
        this.loadWDToolbar();
        this.loadEtappenToolbar();
        // this.loadZoneToolbar();
        this.viewerComponent.viewer.setGhosting(false);
        this.tradeBarchart = new BarChart('Geschoss', this.zones);
        this.allTradesBarchart = new BarChart('Material', this.allZones);
        new Dashboard(this.viewerComponent.viewer, [
          this.tradeBarchart,
          this.allTradesBarchart,
        ]);
        // var chart = new Rangechart();
        // chart.render();
        // new Dashboard(this.viewerComponent.viewer, [this.allTradesBarchart]);
        // new PieChart('Material')

        // new BarChart();
        // Graphische Anpassung
        // $('#forge-viewer').hide();
      },
      // Muss true sein
      showFirstViewable: true,
      // Ist falsch gesetzt => GuiViewer3D => Buttons ausgeblendet in Viewer CSS
      headlessViewer: false,
    };
  }

  ngOnInit(): void { }

  public showTimetablePanel() {
    //////////////// TESTING ///////////////////////////
    if (this.timetablePanel && this.componentRef) {
      console.log('this.timetablePanel && this.componentRef');
      $('#timetablePanel').hide();
      $('#timetablePanel').show();
      const test = {
        series: [
          {
            name: 'Bob',
            data: [
              {
                x: 'Design',
                y: [
                  new Date('2019-03-05').getTime(),
                  new Date('2019-03-08').getTime()
                ]
              },
              {
                x: 'Code',
                y: [
                  new Date('2019-03-02').getTime(),
                  new Date('2019-03-05').getTime()
                ]
              },
              {
                x: 'Code',
                y: [
                  new Date('2019-03-05').getTime(),
                  new Date('2019-03-07').getTime()
                ]
              },
              {
                x: 'Test',
                y: [
                  new Date('2019-03-03').getTime(),
                  new Date('2019-03-09').getTime()
                ]
              },
              {
                x: 'Test',
                y: [
                  new Date('2019-03-08').getTime(),
                  new Date('2019-03-11').getTime()
                ]
              },
              {
                x: 'Validation',
                y: [
                  new Date('2019-03-11').getTime(),
                  new Date('2019-03-16').getTime()
                ]
              },
              {
                x: 'Design',
                y: [
                  new Date('2019-03-01').getTime(),
                  new Date('2019-03-03').getTime()
                ]
              }
            ]
          }
        ],
        chart: {
          height: 450,
          type: 'rangeBar'
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '80%'
          }
        },
        xaxis: {
          type: 'datetime'
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
            stops: [50, 0, 100, 100]
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left'
        }
      };
      this.componentRef.instance.chartOptions = test;
      setTimeout(() => {
        this.componentRef.changeDetectorRef.detectChanges();
      }, 1000);
    }
    // skdjfldsf
    //////////////// TESTING ///////////////////////////
    //////////////// First Click ///////////////////////////
    else {
      var container = this.viewerComponent.viewer.container as HTMLElement;
      this.timetablePanel = new Autodesk.Viewing.UI.DockingPanel(container, 'timetablePanel', 'Showing PDF Panel', { localizeTitle: true, addFooter: true });
      this.timetablePanel.setVisible(true);

      this.timetablePanel.content = document.createElement('div');
      const contentDiv = this.timetablePanel.content as HTMLElement;
      contentDiv.classList.add('container', 'border-box');
      contentDiv.setAttribute('id', 'timetablePanelInsert');
      contentDiv.style.boxSizing = 'border-box';
      // contentDiv.style.overflowY = 'scroll';
      contentDiv.style.color = 'black';
      this.timetablePanel.container.classList.add('docking-panel-container-solid-color-a');
      this.timetablePanel.container.style.resize = 'none';

      // // // FOOTER ==> Orginal Grösse 20 px
      // this.timetablePanel.footer.style.height = '20px';
      // this.timetablePanel.footer.style.paddingLeft = '14px';
      // this.timetablePanel.footer.style.paddingTop = '10px';
      // var valuesDivFooter = document.createElement('div');
      // valuesDivFooter.setAttribute('class', 'p-grid p-align-center');

      // this.timetablePanel.footer.append(valuesDivFooter as HTMLElement);
      this.timetablePanel.container.appendChild(this.timetablePanel.content as HTMLElement);

      const test = {
        series: [
          {
            name: 'Bob',
            data: [
              {
                x: 'Design',
                y: [
                  new Date('2019-03-05').getTime(),
                  new Date('2019-03-08').getTime()
                ]
              },
              {
                x: 'Code',
                y: [
                  new Date('2019-03-02').getTime(),
                  new Date('2019-03-05').getTime()
                ]
              },
              {
                x: 'Code',
                y: [
                  new Date('2019-03-05').getTime(),
                  new Date('2019-03-07').getTime()
                ]
              },
              {
                x: 'Test',
                y: [
                  new Date('2019-03-03').getTime(),
                  new Date('2019-03-09').getTime()
                ]
              },
              {
                x: 'Test',
                y: [
                  new Date('2019-03-08').getTime(),
                  new Date('2019-03-11').getTime()
                ]
              },
              {
                x: 'Validation',
                y: [
                  new Date('2019-03-11').getTime(),
                  new Date('2019-03-16').getTime()
                ]
              },
              {
                x: 'Design',
                y: [
                  new Date('2019-03-01').getTime(),
                  new Date('2019-03-03').getTime()
                ]
              }
            ]
          },
          {
            name: 'Joe',
            data: [
              {
                x: 'Design',
                y: [
                  new Date('2019-03-02').getTime(),
                  new Date('2019-03-05').getTime()
                ]
              },
              {
                x: 'Test',
                y: [
                  new Date('2019-03-06').getTime(),
                  new Date('2019-03-16').getTime()
                ]
              },
              {
                x: 'Code',
                y: [
                  new Date('2019-03-03').getTime(),
                  new Date('2019-03-07').getTime()
                ]
              },
              {
                x: 'Deployment',
                y: [
                  new Date('2019-03-20').getTime(),
                  new Date('2019-03-22').getTime()
                ]
              },
              {
                x: 'Design',
                y: [
                  new Date('2019-03-10').getTime(),
                  new Date('2019-03-16').getTime()
                ]
              }
            ]
          },
          {
            name: 'Dan',
            data: [
              {
                x: 'Code',
                y: [
                  new Date('2019-03-10').getTime(),
                  new Date('2019-03-17').getTime()
                ]
              },
              {
                x: 'Validation',
                y: [
                  new Date('2019-03-05').getTime(),
                  new Date('2019-03-09').getTime()
                ]
              }
            ]
          }
        ],
        chart: {
          height: 450,
          type: 'rangeBar'
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '80%'
          }
        },
        xaxis: {
          type: 'datetime'
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
            stops: [50, 0, 100, 100]
          }
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left'
        }
      };

      let injector = Injector.create([{
        provide: 'TimetableInjection', useValue: { injection: true, sendedSrc: test }
      }]);
      let componentFactory = this.componentFactoryResolver.resolveComponentFactory(TimetableComponent);
      this.componentRef = componentFactory.create(injector, [], $('#timetablePanelInsert')[0]);
      setTimeout(() => {
        this.componentRef.changeDetectorRef.detectChanges();
      }, 1000);
    }
  }

  public async scriptsLoaded() {
    // Extension.registerExtension('LeanBoxesExtension', LeanBoxesExtension);
    // Extension.registerExtension(
    //   'CoordinatesAxesExtension',
    //   CoordinatesAxesExtension
    // );
  }

  public replaceSpinner() {
    const spinners = document.getElementsByClassName('forge-spinner');
    if (spinners.length === 0) {
      return;
    }
    const spinner = spinners[0];
    spinner.classList.remove('forge-spinner');
    spinner.classList.add('lds-roller');
    spinner.innerHTML =
      '<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';
  }

  public loadLevelToolbar() {
    // Button Levels
    const button1 = new Autodesk.Viewing.UI.Button('showing-levels');
    button1.addClass('showing-levels');
    button1.setToolTip('Building Structure');
    // @ts-ignore
    button1.container.children[0].classList.add('fas', 'fa-layer-group');

    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
      'my-custom-toolbar-levels-controlgroup'
    );
    controlGroup.addControl(button1);
    // Toolbar
    this.toolbarLevels = new Autodesk.Viewing.UI.ToolBar(
      'my-custom-view-toolbar-levels',
      { collapsible: false, alignVertically: true }
    );
    button1.onClick = (event) => {
      if (button1.getState() === 1) {
        button1.setState(0);

        this.objectsPerLevel.forEach((object) => {
          if (!object.levelName) {
            object.levelName = 'null';
          }
          // Braucht einen Anhang an jede Klasse, da CSS Klasse nicht mit [0-9] beginnen kann
          const annexClass = 'Class_';

          // iterative Button
          const buttonIterativ = new Autodesk.Viewing.UI.Button(
            annexClass + object.id
          );

          // Click Event !! Important !!
          buttonIterativ.onClick = () => {
            if (buttonIterativ.getState() === 1) {
              buttonIterativ.setState(0);
              if (
                this.isolatedNodesLevels.length === 0 &&
                this.isolatedNodesConcrete.length === 0
              ) {
                this.isolatedNodesLevels = object.dbIds;
                this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
              } else if (
                this.isolatedNodesLevels.length !== 0 &&
                this.isolatedNodesConcrete.length === 0
              ) {
                this.isolatedNodesLevels = this.isolatedNodesLevels.concat(
                  object.dbIds
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
              } else if (
                this.isolatedNodesLevels.length === 0 &&
                this.isolatedNodesConcrete.length !== 0
              ) {
                this.isolatedNodesLevels = this.isolatedNodesConcrete.filter(
                  (item) => {
                    return object.dbIds.indexOf(item) !== -1;
                  }
                );
                if (this.isolatedNodesLevels.length === 0) {
                  return null;
                } else {
                  this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
                }
              }
              // this.isolatedNodesLevels.length !== 0 && this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesLevels = this.isolatedNodesLevels.concat(
                  object.dbIds
                );
                this.isolatedNodesLevels = this.isolatedNodesConcrete.filter(
                  (item) => {
                    return this.isolatedNodesLevels.indexOf(item) !== -1;
                  }
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
              }
            } else {
              buttonIterativ.setState(1);
              if (this.isolatedNodesConcrete.length === 0) {
                this.isolatedNodesLevels = this.isolatedNodesLevels.filter(
                  (item) => {
                    return object.dbIds.indexOf(item) === -1;
                  }
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
              }
              // this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesLevels = this.isolatedNodesLevels.filter(
                  (item) => {
                    return object.dbIds.indexOf(item) === -1;
                  }
                );
                this.isolatedNodesLevels = this.isolatedNodesConcrete.filter(
                  (item) => {
                    return this.isolatedNodesLevels.indexOf(item) !== -1;
                  }
                );
                if (this.isolatedNodesLevels.length === 0) {
                  this.viewerComponent.viewer.isolate(
                    this.isolatedNodesConcrete
                  );
                } else {
                  this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
                }
              }
            }
          };

          // test

          buttonIterativ.addClass(annexClass + object.id);
          controlGroup.addControl(buttonIterativ);
          // tslint:disable-next-line: max-line-length
          $('#' + annexClass + object.id).append(
            '<style>.' +
            annexClass +
            object.id +
            ':before{content: attr(data-before); font-size: 20px; color: white;}</style>'
          );
          $('#' + annexClass + object.id).append(
            '<style>.' +
            annexClass +
            object.id +
            '{width: 178px !important}</style>'
          );
          $('#' + annexClass + object.id).append(
            '<style>.' +
            annexClass +
            object.id +
            '{animation: slideMe .7s ease-in;}</style>'
          );
          $('#' + annexClass + object.id.toString()).attr(
            'data-before',
            object.levelName
          );
        });
      } else {
        button1.setState(1);
        this.isolatedNodesLevels = new Array();
        while (controlGroup.getNumberOfControls() > 1) {
          const tempID = controlGroup.getControlId(1);
          controlGroup.removeControl(tempID);
        }
      }
    };
    this.toolbarLevels.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(
      this.toolbarLevels.container
    );
  }

  public loadConcreteToolbar() {
    // Button Concrete
    const button1 = new Autodesk.Viewing.UI.Button('showing-concrete');
    button1.addClass('showing-concrete');
    button1.setToolTip('Concrete Materials');
    // @ts-ignore
    button1.container.children[0].classList.add('fas', 'fa-hammer');

    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
      'my-custom-toolbar-concrete-controlgroup'
    );
    controlGroup.addControl(button1);
    // Toolbar
    this.toolbarConcrete = new Autodesk.Viewing.UI.ToolBar(
      'my-custom-view-toolbar-concrete',
      { collapsible: false, alignVertically: true }
    );
    button1.onClick = (event) => {
      if (button1.getState() === 1) {
        button1.setState(0);
        this.concrObj.forEach((object) => {
          if (!object.materialName) {
            object.materialName = 'null';
          }
          // Braucht einen Anhang an jede Klasse, da CSS Klasse nicht mit [0-9] beginnen kann
          const annexClass = 'Class_';

          // iterative Button
          const buttonIterativ = new Autodesk.Viewing.UI.Button(
            annexClass + object.id
          );

          // Click Event !! Important !!
          buttonIterativ.onClick = () => {
            if (buttonIterativ.getState() === 1) {
              buttonIterativ.setState(0);
              if (
                this.isolatedNodesLevels.length === 0 &&
                this.isolatedNodesConcrete.length === 0
              ) {
                this.isolatedNodesConcrete = object.dbIds;
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              } else if (
                this.isolatedNodesLevels.length === 0 &&
                this.isolatedNodesConcrete.length !== 0
              ) {
                this.isolatedNodesConcrete = this.isolatedNodesConcrete.concat(
                  object.dbIds
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              } else if (
                this.isolatedNodesLevels.length !== 0 &&
                this.isolatedNodesConcrete.length === 0
              ) {
                this.isolatedNodesConcrete = this.isolatedNodesLevels.filter(
                  (item) => {
                    return object.dbIds.indexOf(item) !== -1;
                  }
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              }
              // this.isolatedNodesLevels.length !== 0 && this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesConcrete = this.isolatedNodesConcrete.concat(
                  object.dbIds
                );
                this.isolatedNodesConcrete = this.isolatedNodesLevels.filter(
                  (item) => {
                    return this.isolatedNodesConcrete.indexOf(item) !== -1;
                  }
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              }
            } else {
              buttonIterativ.setState(1);
              if (this.isolatedNodesLevels.length === 0) {
                this.isolatedNodesConcrete = this.isolatedNodesConcrete.filter(
                  (item) => {
                    return this.isolatedNodesConcrete.indexOf(item) === -1;
                  }
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              }
              // this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesConcrete = this.isolatedNodesConcrete.filter(
                  (item) => {
                    return object.dbIds.indexOf(item) === -1;
                  }
                );
                this.isolatedNodesConcrete = this.isolatedNodesLevels.filter(
                  (item) => {
                    return this.isolatedNodesConcrete.indexOf(item) !== -1;
                  }
                );
                if (this.isolatedNodesConcrete.length === 0) {
                  this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
                } else {
                  this.viewerComponent.viewer.isolate(
                    this.isolatedNodesConcrete
                  );
                }
              }
            }
          };

          buttonIterativ.addClass(annexClass + object.id);
          controlGroup.addControl(buttonIterativ);
          // tslint:disable-next-line: max-line-length
          $('#' + annexClass + object.id).append(
            '<style>.' +
            annexClass +
            object.id +
            ':before{content: attr(data-before); font-size: 20px; color: white;}</style>'
          );
          $('#' + annexClass + object.id).append(
            '<style>.' +
            annexClass +
            object.id +
            '{width: 178px !important}</style>'
          );
          $('#' + annexClass + object.id).append(
            '<style>.' +
            annexClass +
            object.id +
            '{animation: slideMe .7s ease-in;}</style>'
          );
          $('#' + annexClass + object.id.toString()).attr(
            'data-before',
            object.materialName
          );
        });
      } else {
        button1.setState(1);
        this.isolatedNodesConcrete = new Array();
        while (controlGroup.getNumberOfControls() > 1) {
          const tempID = controlGroup.getControlId(1);
          controlGroup.removeControl(tempID);
        }
      }
    };
    // this.toolbarConcrete = new Autodesk.Viewing.UI.ToolBar(
    //   'my-custom-view-toolbar-concrete',
    //   { collapsible: false, alignVertically: true }
    // );
    this.toolbarConcrete.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(
      this.toolbarConcrete.container
    );
  }

  public loadZoneToolbar() {
    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
      'my-custom-toolbar-test-controlgroup'
    );
    //button1
    const button1 = new Autodesk.Viewing.UI.Button('creating-zones');
    button1.addClass('creating-zones');
    button1.setToolTip('Create WDbars for all trades');
    //@ts-ignore
    button1.container.children[0].classList.add('fas', 'fa-puzzle-piece');
    // button1.setIcon('far fa-question-circle');
    //button2
    const button2 = new Autodesk.Viewing.UI.Button('creating-zones-1trade');
    button2.addClass('creating-zones-1trade');
    button2.setToolTip('Create WDbars for one trade');
    //@ts-ignore
    button2.container.children[0].classList.add('fab', 'fa-tumblr');
    //buttons for Crew Size (3,4,5,6)
    const button3 = new Autodesk.Viewing.UI.Button('optimizing-crewSizeF');
    button3.addClass('optimizing-crewSizeF');
    button3.setToolTip('Change CS of Installing Formwork');
    // @ts-ignore
    button3.container.children[0].classList.add('fab', 'fa-facebook-f');

    const button4 = new Autodesk.Viewing.UI.Button('optimizing-crewSizeR');
    button4.addClass('optimizing-crewSizeR');
    button4.setToolTip('Change CS of Installing Reinforcement');
    // @ts-ignore
    button4.container.children[0].classList.add('far', 'fa-registered');
    const button5 = new Autodesk.Viewing.UI.Button('optimizing-crewSizeC');
    button5.addClass('optimizing-crewSizeC');
    button5.setToolTip('Change CS of Pouring Concrete');
    // @ts-ignore
    button5.container.children[0].classList.add('fas', 'fa-truck-pickup');
    const button6 = new Autodesk.Viewing.UI.Button('optimizing-crewSizeS');
    button6.addClass('optimizing-crewSizeS');
    button6.setToolTip('Change CS of Stripping Formwork');
    // @ts-ignore
    button6.container.children[0].classList.add('fab', 'fa-stripe-s');
    // buttons for Production Rates (7,8,9,10)
    const button7 = new Autodesk.Viewing.UI.Button('optimizing-ProdRateF');
    button7.addClass('optimizing-ProdRateF');
    button7.setToolTip('Change PR of Installing Formwork');
    // @ts-ignore
    button7.container.children[0].classList.add('fab', 'fa-facebook-f');

    const button8 = new Autodesk.Viewing.UI.Button('optimizing-ProdRateR');
    button8.addClass('optimizing-ProdRateR');
    button8.setToolTip('Change PR of Installing Reinforcement');
    // @ts-ignore
    button8.container.children[0].classList.add('far', 'fa-registered');
    const button9 = new Autodesk.Viewing.UI.Button('optimizing-ProdRateC');
    button9.addClass('optimizing-ProdRateC');
    button9.setToolTip('Change PR of Pouring Concrete');
    // @ts-ignore
    button9.container.children[0].classList.add('fas', 'fa-truck-pickup');
    const button10 = new Autodesk.Viewing.UI.Button('optimizing-ProdRateS');
    button10.addClass('optimizing-ProdRateS');
    button10.setToolTip('Change PR of Stripping Formwork');
    // @ts-ignore
    button10.container.children[0].classList.add('fab', 'fa-stripe-s');
    // Buttons for deleting (11,12)
    const button11 = new Autodesk.Viewing.UI.Button('deleting-lastZone');
    button11.addClass('deleting-lastZone');
    button11.setToolTip('Delete last Zone');
    // @ts-ignore
    button11.container.children[0].classList.add('fas', 'fa-backspace');
    const button12 = new Autodesk.Viewing.UI.Button('deleting-allZones');
    button12.addClass('deleting-allZones');
    button12.setToolTip('Delete All Zones');
    // @ts-ignore
    button12.container.children[0].classList.add('fas', 'fa-trash');
    // Combo Buttons
    const combButton1 = new Autodesk.Viewing.UI.ComboButton(
      'my-custom-comboButton-crewSize'
    );
    combButton1.addClass('my-custom-comboButton-crewSize');
    combButton1.setToolTip('Optimize Crew Size');
    // @ts-ignore
    combButton1.container.children[2].classList.add('fas', 'fa-user-friends');
    // // .classList.add('fas', 'fa-puzzle-piece');
    const combButton2 = new Autodesk.Viewing.UI.ComboButton(
      'my-custom-comboButton-productionRates'
    );
    combButton2.addClass('my-custom-comboButton-productionRates');
    combButton2.setToolTip('Optimize Production Rate');
    // @ts-ignore
    combButton2.container.children[2].classList.add('fas', 'fa-people-carry');
    const combButton3 = new Autodesk.Viewing.UI.ComboButton(
      'my-custom-comboButton-delete'
    );
    combButton3.addClass('my-custom-comboButton-delete');
    combButton3.setToolTip('Delete Options');
    // @ts-ignore
    combButton3.container.children[2].classList.add('far', 'fa-trash-alt');
    // @ts-ignore
    combButton1.addControl(button3);
    // @ts-ignore
    combButton1.addControl(button4);
    // @ts-ignore
    combButton1.addControl(button5);
    // @ts-ignore
    combButton1.addControl(button6);
    // @ts-ignore
    combButton2.addControl(button7);
    // @ts-ignore
    combButton2.addControl(button8);
    // @ts-ignore
    combButton2.addControl(button9);
    // @ts-ignore
    combButton2.addControl(button10);
    // @ts-ignore
    combButton3.addControl(button11);
    // @ts-ignore
    combButton3.addControl(button12);
    // Control Group
    controlGroup.addControl(button1);
    controlGroup.addControl(button2);
    controlGroup.addControl(combButton3);
    controlGroup.addControl(combButton1);
    controlGroup.addControl(combButton2);

    button1.onClick = (event) => {
      //Test functions
      console.log('All Trades Zoning started');
      //get current selection
      const selection = this.viewerComponent.viewer.getSelection();
      // console.log(selection);
      this.viewerComponent.viewer.clearSelection();
      if (selection.length > 0 && !this.belongsToAllZones(selection)) {
        const zone = new Zone(this.makeid(5));
        this.computeWDbars(selection, zone);
      }
      this.createAndUpdateBarChart();
    };
    button2.onClick = (event) => {
      console.log('1 Trade Zoning started');
      //get current selection
      const selection = this.viewerComponent.viewer.getSelection();
      // console.log(selection);
      this.viewerComponent.viewer.clearSelection();
      const wdControlGroup = this.viewerComponent.viewer.toolbar.getControl(
        'my-custom-toolbar-WD-controlgroup'
      );
      // @ts-ignore
      const controlInstFormwork = wdControlGroup._controls[0].getState();
      // console.log(controlInstFormwork);
      // @ts-ignore
      const controlInstReinforcement = wdControlGroup._controls[1].getState();
      // @ts-ignore
      const controlPourConcrete = wdControlGroup._controls[2].getState();
      // @ts-ignore
      const controlCuring = wdControlGroup._controls[3].getState();
      // @ts-ignore
      const controlStripFormwork = wdControlGroup._controls[4].getState();

      if (
        selection.length > 0 &&
        // !this.belongsToZone(selection) &&
        this.isWDtoolbarAct(
          controlInstFormwork,
          controlInstReinforcement,
          controlPourConcrete,
          controlCuring,
          controlStripFormwork
        )
      ) {
        const zone = new Zone(this.makeid(5));
        // console.log(selection);
        this.compute1tradeWDbars(selection, zone);
        // console.log(this.zones);
        this.createAndUpdate1TradeBarChart();
      }
    };
    button3.onClick = (event) => {
      this.showInputPanel('Change Crew Size Installing Formwork', 'csF');
    };
    button4.onClick = (event) => {
      this.showInputPanel('Change Crew Size Installing Reinforcement', 'csR');
    };
    button5.onClick = (event) => {
      this.showInputPanel('Change Crew Size Pouring Concrete', 'csC');
    };
    button6.onClick = (event) => {
      this.showInputPanel('Change Crew Size Stripping Formwork', 'csS');
    };

    button7.onClick = (event) => {
      this.showInputPanel('Change Production Rate Installing Formwork', 'prF');
    };
    button8.onClick = (event) => {
      this.showInputPanel(
        'Change Production Rate Installing Reinforcement',
        'prR'
      );
    };
    button9.onClick = (event) => {
      this.showInputPanel('Change Production Rate Pouring Concrete', 'prC');
    };
    button10.onClick = (event) => {
      this.showInputPanel('Change Production Rate Stripping Formwork', 'prS');
    };

    button11.onClick = (event) => {
      if (this.allZones.length > 0) {
        const fragList = this.viewerComponent.viewer.model.getFragmentList();
        const coloringMap = fragList.db2ThemingColor;
        const deletedZone = this.allZones.pop();
        console.log(deletedZone);
        deletedZone.dbIds.forEach((dbid) => {
          delete coloringMap[dbid];
        });
        this.createAndUpdateBarChart();
      }
    };
    button12.onClick = (event) => {
      if (this.allZones.length > 0) {
        // this.viewerComponent.viewer.clearThemingColors(
        //   this.viewerComponent.viewer.model
        // );
        const fragList = this.viewerComponent.viewer.model.getFragmentList();
        const coloringMap = fragList.db2ThemingColor;
        this.allZones.forEach((zone) => {
          zone.dbIds.forEach((dbid) => {
            delete coloringMap[dbid];
          });
          this.allZones = [];
        });
        this.createAndUpdateBarChart();
      }
      if (this.zones.length > 0) {
        // this.viewerComponent.viewer.clearThemingColors(
        //   this.viewerComponent.viewer.model
        // );
        const fragList = this.viewerComponent.viewer.model.getFragmentList();
        const coloringMap = fragList.db2ThemingColor;
        this.zones.forEach((zone) => {
          zone.dbIds.forEach((dbid) => {
            delete coloringMap[dbid];
          });
          this.zones = [];
        });
        this.createAndUpdate1TradeBarChart();
      }
    };

    // There we have to wait since the toolbar is not loaded
    setTimeout(() => {
      this.viewerComponent.viewer.toolbar.addControl(controlGroup);
    }, 5000);
    $('#guiviewer3d-toolbar').append(controlGroup.container);
  }

  public loadWDToolbar() {
    // button test
    const button1 = new Autodesk.Viewing.UI.Button('showing-WDformwork');
    button1.addClass('showing-WDformwork');
    button1.setToolTip('WDmap for Installing Formwork');
    // @ts-ignore
    button1.container.children[0].classList.add('fab', 'fa-facebook-f');
    // button1.setIcon('far fa-question-circle');
    // SubToolbar
    const button2 = new Autodesk.Viewing.UI.Button('showing-WDreinforcement');

    button2.addClass('showing-WDreinforcement');
    button2.setToolTip('WDmap for Installing Reinforcement');
    // @ts-ignore
    button2.container.children[0].classList.add('far', 'fa-registered');
    const button3 = new Autodesk.Viewing.UI.Button('showing-WDconcrete');

    button3.addClass('showing-WDconcrete');
    button3.setToolTip('WDmap for Pouring Concrete');
    // @ts-ignore
    button3.container.children[0].classList.add('fas', 'fa-truck-pickup');
    const button4 = new Autodesk.Viewing.UI.Button('showing-WDcuring');

    button4.addClass('showing-WDcuring');
    button4.setToolTip('WDmap for Curing of Concrete');
    // @ts-ignore
    button4.container.children[0].classList.add('fab', 'fa-cuttlefish');
    const button5 = new Autodesk.Viewing.UI.Button('showing-WDstrip');

    button5.addClass('showing-WDstrip');
    button5.setToolTip('WDmap for Stripping Formwork');
    // @ts-ignore
    button5.container.children[0].classList.add('fab', 'fa-stripe-s');

    const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
      'my-custom-toolbar-WD-controlgroup'
    );
    controlGroup.addControl(button1);
    controlGroup.addControl(button2);
    controlGroup.addControl(button3);
    controlGroup.addControl(button4);
    controlGroup.addControl(button5);
    // Toolbar
    // this.toolbarTest = new Autodesk.Viewing.UI.ToolBar(
    //   'my-custom-view-toolbar-test',
    //   { collapsible: false, alignVertically: false }
    // );

    button1.onClick = (event) => {
      if (button1.getState() === 1) {
        button1.setState(0);
        button2.setState(1);
        button3.setState(1);
        button4.setState(1);
        button5.setState(1);
        const list = document.getElementById('tempPanel');
        if (list) {
          document.body.removeChild(list);
        }
        this.colorWdObjects(this.walls, 'WDwF');
        this.colorWdObjects(this.columns, 'WDcF');
        this.colorWdObjects(this.slabs, 'WDsF');
        this.setupUI();
      } else {
        button1.setState(1);
        this.viewerComponent.viewer.clearThemingColors(
          this.viewerComponent.viewer.model
        );
        const list = document.getElementById('tempPanel');
        document.body.removeChild(list);

        // while (controlGroup.getNumberOfControls() > 5) {
        //   var tempID = controlGroup.getControlId(5);
        //   console.log(tempID);
        //   controlGroup.removeControl(tempID);
        // }
      }
    };
    button2.onClick = (event) => {
      if (button2.getState() === 1) {
        button2.setState(0);
        button1.setState(1);
        button3.setState(1);
        button4.setState(1);
        button5.setState(1);
        const list = document.getElementById('tempPanel');
        // console.log(list);
        if (list) {
          document.body.removeChild(list);
        }
        this.colorWdObjects(this.walls, 'WDwR');

        this.colorWdObjects(this.columns, 'WDcR');

        this.colorWdObjects(this.slabs, 'WDsR');
        this.setupUI();
      } else {
        button2.setState(1);
        this.viewerComponent.viewer.clearThemingColors(
          this.viewerComponent.viewer.model
        );
        const list = document.getElementById('tempPanel');
        document.body.removeChild(list);

        // while (controlGroup.getNumberOfControls() > 5) {
        //   var tempID = controlGroup.getControlId(5);
        //   controlGroup.removeControl(tempID);
        // }
      }
    };
    button3.onClick = (event) => {
      if (button3.getState() === 1) {
        button3.setState(0);
        button2.setState(1);
        button1.setState(1);
        button4.setState(1);
        button5.setState(1);
        const list = document.getElementById('tempPanel');
        // console.log(list);
        if (list) {
          document.body.removeChild(list);
        }
        this.colorWdObjects(this.walls, 'WDwC');

        this.colorWdObjects(this.columns, 'WDcC');

        this.colorWdObjects(this.slabs, 'WDsC');
        this.setupUI();
      } else {
        button3.setState(1);
        this.viewerComponent.viewer.clearThemingColors(
          this.viewerComponent.viewer.model
        );
        const list = document.getElementById('tempPanel');
        document.body.removeChild(list);

        // while (controlGroup.getNumberOfControls() > 5) {
        //   var tempID = controlGroup.getControlId(5);
        //   controlGroup.removeControl(tempID);
        // }
      }
    };
    button4.onClick = (event) => {
      if (button4.getState() === 1) {
        button4.setState(0);
        button2.setState(1);
        button3.setState(1);
        button1.setState(1);
        button5.setState(1);
        const list = document.getElementById('tempPanel');
        // console.log(list);
        if (list) {
          document.body.removeChild(list);
        }

        this.colorWdObjects(this.walls, 'WDwCR');

        this.colorWdObjects(this.columns, 'WDcCR');

        this.colorWdObjects(this.slabs, 'WDsCR');
        this.setupUI();
      } else {
        button4.setState(1);
        this.viewerComponent.viewer.clearThemingColors(
          this.viewerComponent.viewer.model
        );
        const list = document.getElementById('tempPanel');
        document.body.removeChild(list);

        // while (controlGroup.getNumberOfControls() > 5) {
        //   var tempID = controlGroup.getControlId(5);
        //   controlGroup.removeControl(tempID);
        // }
      }
    };
    button5.onClick = (event) => {
      if (button5.getState() === 1) {
        button5.setState(0);
        button2.setState(1);
        button3.setState(1);
        button4.setState(1);
        button1.setState(1);
        ///// test////////
        // new Dashboard(this.viewerComponent.viewer, [new BarChart()]);
        /////////////
        const list = document.getElementById('tempPanel');
        // console.log(list);
        if (list) {
          document.body.removeChild(list);
        }
        this.colorWdObjects(this.walls, 'WDwS');

        this.colorWdObjects(this.columns, 'WDcS');

        this.colorWdObjects(this.slabs, 'WDsS');
        this.setupUI();
      } else {
        button5.setState(1);
        this.viewerComponent.viewer.clearThemingColors(
          this.viewerComponent.viewer.model
        );
        const list = document.getElementById('tempPanel');
        // console.log(list);
        document.body.removeChild(list);

        // while (controlGroup.getNumberOfControls() > 5) {
        //   var tempID = controlGroup.getControlId(5);
        //   controlGroup.removeControl(tempID);
        // }
      }
    };
    // There we have to wait since the toolbar is not loaded
    setTimeout(() => {
      this.viewerComponent.viewer.toolbar.addControl(controlGroup);
    }, 5000);
    $('#guiviewer3d-toolbar').append(controlGroup.container);
  }
<<<<<<< HEAD
  public loadPropInputToolbar() {
=======

  public loadPropToolbar() {
>>>>>>> d03d98cc36170cd5324597c63019d8a27e8151e5
    //Button 1 fro Properties Legend
    const button1 = new Autodesk.Viewing.UI.Button('show-prop');
    button1.addClass('show-prop');
    button1.setToolTip('Show Properies Legend');
    //@ts-ignore
    button1.container.children[0].classList.add('far', 'fa-question-circle');
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
      'my-custom-Properties-controlgroup'
    );
    controlGroup.addControl(button1);
    button1.onClick = (event) => {
      //Test functions
      // console.log('Test started');
      this.showPropLegend();
      // this.showInitialInputPanel();
      // this.exportDashboard();
      this.findStandardSlab();
      this.findStandardWall();
    };
    //Button 1 fro Properties Legend
    const button2 = new Autodesk.Viewing.UI.Button('show-initPanel');
    button2.addClass('initPanel');
    button2.setToolTip('Show Initial Input Panel');
    //@ts-ignore
    button2.container.children[0].classList.add('fas', 'fa-file-import');

    controlGroup.addControl(button2);
    button2.onClick = (event) => {
      //Test functions
      // console.log('Test started');
      // this.showPropLegend();
      this.showInitialInputPanel();
      // this.exportDashboard();
      // this.findStandardSlab();
      // this.findStandardWall();
    };
<<<<<<< HEAD

=======
    //Button 2 for timetable
    const button2 = new Autodesk.Viewing.UI.Button('show-timetable');
    button2.addClass('show-timetable');
    button2.setToolTip('Show Timetable');
    //@ts-ignore
    button2.container.children[0].classList.add('fas', 'fa-stream');

    controlGroup.addControl(button2);
    button2.onClick = (event) => {
      this.showTimetablePanel();
    };
>>>>>>> d03d98cc36170cd5324597c63019d8a27e8151e5
    // There we have to wait since the toolbar is not loaded
    setTimeout(() => {
      this.viewerComponent.viewer.toolbar.addControl(controlGroup);
    }, 5000);
    $('#guiviewer3d-toolbar').append(controlGroup.container);
  }

  public showInputPanel(what: string, parameter: string) {
    // $('#sectionPanel').hide();
    const container = this.viewerComponent.viewer.container as HTMLElement;
    this.inputPanel = new Autodesk.Viewing.UI.DockingPanel(
      container,
      'inputPanel',
      'Input Panel -> ' + what,
      { localizeTitle: true, addFooter: true }
    );
    this.inputPanel.setVisible(true);
    this.inputPanel.addVisibilityListener((show) => {
      // Logic for closing the panel
      if (!show) {
        // this.onCloseNewSectionPanel();
      }
    });
    this.inputPanel.content = document.createElement('div');
    const contentDiv = this.inputPanel.content as HTMLElement;
    contentDiv.classList.add('container', 'border-box');
    contentDiv.style.boxSizing = 'border-box';
    $(this.inputPanel.content).append(inputHTML);
    contentDiv.style.overflowY = 'hidden';
    contentDiv.style.height = 'calc(100% - 105px)';
    contentDiv.style.color = 'black';
    this.inputPanel.container.classList.add(
      'docking-panel-container-solid-color-a'
    );
    this.inputPanel.container.style.height = '250px';
    this.inputPanel.container.style.width = '500px';
    this.inputPanel.container.style.minWidth = '500px';
    this.inputPanel.container.style.resize = 'none';

    // // FOOTER ==> Orginal Grösse 20 px
    this.inputPanel.footer.style.height = '55px';
    // this.inputPanel.footer.style.paddingLeft = '14px';
    this.inputPanel.footer.style.paddingTop = '12.5px';
    const valuesDivFooter = document.createElement('div');
    valuesDivFooter.setAttribute('class', 'p-grid p-align-center');

    const saveButton = document.createElement('button');
    saveButton.setAttribute('class', 'button-footer-panel');
    saveButton.setAttribute('style', 'margin-left: 45px');
    saveButton.setAttribute('id', 'saveNewSection');
    saveButton.textContent = 'Save';
    valuesDivFooter.appendChild(saveButton);
    const cancelButton = document.createElement('button');
    cancelButton.setAttribute('class', 'button-footer-panel');
    cancelButton.setAttribute('style', 'margin-left: 60px');
    cancelButton.setAttribute('id', 'cancelNewSection');
    cancelButton.textContent = 'Cancel';
    valuesDivFooter.appendChild(cancelButton);
    // Workaround, da onclick Button irgendwie nicht funktioniert
    valuesDivFooter.addEventListener('click', (event) => {
      // @ts-ignore
      if (event.target.id === 'saveNewSection') {
        // @ts-ignore
        const userInput = document.getElementById('userInput').value;
        console.log(userInput);
        // get current selection
        const selection = this.viewerComponent.viewer.getSelection();
        // console.log(selection);
        this.viewerComponent.viewer.clearSelection();
        this.allZones.forEach((zone) => {
          let count = 0;
          selection.forEach((dbId) => {
            if (zone.dbIds.includes(dbId)) {
              count++;
            }
          });
          if (selection.length !== 0 && selection.length === count) {
            zone.objects.forEach((obj) => {
              obj[parameter] = userInput;
            });
            // console.log(zone.objects);
            this.calcWD(this.slabs);
            this.calcWD(this.walls);
            this.calcWD(this.columns);
            this.updateWDbars(selection, zone);
          }
        });
        this.createAndUpdateBarChart();
        $('#inputPanel').hide();
        // @ts-ignore
        // document.getElementById('userInput').value = null;
        const inputContainer = this.inputPanel.container;
        this.viewerComponent.viewer.container.removeChild(inputContainer);
      }
      // @ts-ignore
      else if (event.target.id === 'cancelNewSection') {
        $('#inputPanel').hide();
        // @ts-ignore
        // document.getElementById('userInput').value = null;
        const inputContainer = this.inputPanel.container;
        this.viewerComponent.viewer.container.removeChild(inputContainer);
      }
    });
    this.inputPanel.footer.append(valuesDivFooter as HTMLElement);

    this.inputPanel.container.appendChild(
      this.inputPanel.content as HTMLElement
    );

    const textDivHeader11 = document.createElement('div');
    textDivHeader11.setAttribute('class', 'p-col-6');
    textDivHeader11.setAttribute('style', 'width: 45%');
    textDivHeader11.innerHTML =
      '<div class="box-section-new">' + 'Number' + '</div>';
    textDivHeader11.style.color = 'black';
    $(this.inputPanel.container)
      .find('#newInput')[0]
      .appendChild(textDivHeader11 as HTMLElement);

    const textDivHeader12 = document.createElement('div');
    textDivHeader12.setAttribute('class', 'p-col-6');
    textDivHeader12.setAttribute('style', 'width: 45%');
    const inputNumber = document.createElement('input');

    inputNumber.setAttribute('class', 'custom-input');
    inputNumber.setAttribute('id', 'userInput');
    inputNumber.setAttribute('type', 'number');
    textDivHeader12.appendChild(inputNumber);
    $(this.inputPanel.container)
      .find('#newInput')[0]
      .appendChild(textDivHeader12 as HTMLElement);
  }
  public showInitialInputPanel() {
    // $('#sectionPanel').hide();
    const container = this.viewerComponent.viewer.container as HTMLElement;
    this.initialInputPanel = new Autodesk.Viewing.UI.DockingPanel(
      container,
      'initialInputPanel',
      'Initial Input Panel',
      { localizeTitle: true, addFooter: true }
    );
    this.initialInputPanel.setVisible(true);
    this.initialInputPanel.addVisibilityListener((show) => {
      // Logic for closing the panel
      if (!show) {
        // this.onCloseNewSectionPanel();
      }
    });
    this.initialInputPanel.content = document.createElement('div');
    const contentDiv = this.initialInputPanel.content as HTMLElement;
    contentDiv.classList.add('container', 'border-box');
    contentDiv.style.boxSizing = 'border-box';
    $(this.initialInputPanel.content).append(initialInputHTML);
    contentDiv.style.overflowY = 'hidden';
    contentDiv.style.height = 'calc(100% - 105px)';
    contentDiv.style.color = 'black';
    this.initialInputPanel.container.classList.add(
      'docking-panel-container-solid-color-a'
    );
    this.initialInputPanel.container.style.height = '500px';
    this.initialInputPanel.container.style.width = '500px';
    this.initialInputPanel.container.style.minWidth = '500px';
    this.initialInputPanel.container.style.resize = 'none';

    // // FOOTER ==> Orginal Grösse 20 px
    this.initialInputPanel.footer.style.height = '55px';
    // this.initialInputPanel.footer.style.paddingLeft = '14px';
    this.initialInputPanel.footer.style.paddingTop = '12.5px';
    const valuesDivFooter = document.createElement('div');
    valuesDivFooter.setAttribute('class', 'p-grid p-align-center');

    const saveButton = document.createElement('button');
    saveButton.setAttribute('class', 'button-footer-panel');
    saveButton.setAttribute('style', 'margin-left: 45px');
    saveButton.setAttribute('id', 'saveNewSection');
    saveButton.textContent = 'Save';
    valuesDivFooter.appendChild(saveButton);
    const cancelButton = document.createElement('button');
    cancelButton.setAttribute('class', 'button-footer-panel');
    cancelButton.setAttribute('style', 'margin-left: 60px');
    cancelButton.setAttribute('id', 'cancelNewSection');
    cancelButton.textContent = 'Cancel';
    valuesDivFooter.appendChild(cancelButton);
    // Workaround, da onclick Button irgendwie nicht funktioniert
    valuesDivFooter.addEventListener('click', (event) => {
      // @ts-ignore
      if (event.target.id === 'saveNewSection') {
        // @ts-ignore
        const userInputcsF = document.getElementById('userInputcsF').value;
        console.log(userInputcsF);
        // @ts-ignore
        const userInputcsR = document.getElementById('userInputcsR').value;
        // @ts-ignore
        const userInputcsC = document.getElementById('userInputcsC').value;
        // @ts-ignore
        const userInputcsS = document.getElementById('userInputcsS').value;
        // @ts-ignore
        const userInputprF = document.getElementById('userInputprF').value;
        // @ts-ignore
        const userInputprR = document.getElementById('userInputprR').value;
        // @ts-ignore
        const userInputprC = document.getElementById('userInputprC').value;
        // @ts-ignore
        const userInputprS = document.getElementById('userInputprS').value;

        this.walls.forEach((element) => {
          element.csF = parseInt(userInputcsF);
          element.csR = parseInt(userInputcsR);
          element.csC = parseInt(userInputcsC);
          element.csS = parseInt(userInputcsS);
          element.prF = parseFloat(userInputprF);
          element.prR = parseFloat(userInputprR);
          element.prC = parseFloat(userInputprC);
          element.prS = parseFloat(userInputprS);
        });
        this.columns.forEach((element) => {
          element.csF = parseInt(userInputcsF);
          element.csR = parseInt(userInputcsR);
          element.csC = parseInt(userInputcsC);
          element.csS = parseInt(userInputcsS);
          element.prF = parseFloat(userInputprF);
          element.prR = parseFloat(userInputprR);
          element.prC = parseFloat(userInputprC);
          element.prS = parseFloat(userInputprS);
        });
        this.slabs.forEach((element) => {
          element.csF = parseInt(userInputcsF);
          element.csR = parseInt(userInputcsR);
          element.csC = parseInt(userInputcsC);
          element.csS = parseInt(userInputcsS);
          element.prF = parseFloat(userInputprF);
          element.prR = parseFloat(userInputprR);
          element.prC = parseFloat(userInputprC);
          element.prS = parseFloat(userInputprS);
        });
        this.calcWD(this.slabs);
        this.calcWD(this.walls);
        this.calcWD(this.columns);
        console.log(this.slabs);

        $('#initialInputPanel').hide();
        // @ts-ignore
        // document.getElementById('userInput').value = null;
        const inputContainer = this.initialInputPanel.container;
        this.viewerComponent.viewer.container.removeChild(inputContainer);
      }
      // @ts-ignore
      else if (event.target.id === 'cancelNewSection') {
        $('#initialInputPanel').hide();
        // @ts-ignore
        // document.getElementById('userInput').value = null;
        const inputContainer = this.initialInputPanel.container;
        this.viewerComponent.viewer.container.removeChild(inputContainer);
      }
    });
    this.initialInputPanel.footer.append(valuesDivFooter as HTMLElement);

    this.initialInputPanel.container.appendChild(
      this.initialInputPanel.content as HTMLElement
    );

    const textDivHeaderA1 = document.createElement('div');
    textDivHeaderA1.setAttribute('class', 'p-col-6');
    textDivHeaderA1.setAttribute('style', 'width: 45%');
    textDivHeaderA1.innerHTML =
      '<div class="box-section-new">' +
      'Crew Size of Installing Formwork [ppl]' +
      '</div>';
    textDivHeaderA1.style.color = 'black';
    $(this.initialInputPanel.container)
      .find('#NuserInputcsF')[0]
      .appendChild(textDivHeaderA1 as HTMLElement);

    const textDivHeaderA2 = document.createElement('div');
    textDivHeaderA2.setAttribute('class', 'p-col-6');
    textDivHeaderA2.setAttribute('style', 'width: 45%');
    const inputNumberA = document.createElement('input');

    inputNumberA.setAttribute('class', 'custom-input');
    inputNumberA.setAttribute('id', 'userInputcsF');
    inputNumberA.setAttribute('type', 'number');
    textDivHeaderA2.appendChild(inputNumberA);
    $(this.initialInputPanel.container)
      .find('#NuserInputcsF')[0]
      .appendChild(textDivHeaderA2 as HTMLElement);

    const textDivHeaderB1 = document.createElement('div');
    textDivHeaderB1.setAttribute('class', 'p-col-6');
    textDivHeaderB1.setAttribute('style', 'width: 45%');
    textDivHeaderB1.innerHTML =
      '<div class="box-section-new">' +
      'Crew Size of Installing Reinforcement [ppl]' +
      '</div>';
    textDivHeaderB1.style.color = 'black';
    $(this.initialInputPanel.container)
      .find('#NuserInputcsR')[0]
      .appendChild(textDivHeaderB1 as HTMLElement);

    const textDivHeaderB2 = document.createElement('div');
    textDivHeaderB2.setAttribute('class', 'p-col-6');
    textDivHeaderB2.setAttribute('style', 'width: 45%');
    const inputNumberB = document.createElement('input');

    inputNumberB.setAttribute('class', 'custom-input');
    inputNumberB.setAttribute('id', 'userInputcsR');
    inputNumberB.setAttribute('type', 'number');
    textDivHeaderB2.appendChild(inputNumberB);
    $(this.initialInputPanel.container)
      .find('#NuserInputcsR')[0]
      .appendChild(textDivHeaderB2 as HTMLElement);

    const textDivHeaderC1 = document.createElement('div');
    textDivHeaderC1.setAttribute('class', 'p-col-6');
    textDivHeaderC1.setAttribute('style', 'width: 45%');
    textDivHeaderC1.innerHTML =
      '<div class="box-section-new">' +
      'Crew Size of Pouring Concrete [ppl]' +
      '</div>';
    textDivHeaderC1.style.color = 'black';
    $(this.initialInputPanel.container)
      .find('#NuserInputcsC')[0]
      .appendChild(textDivHeaderC1 as HTMLElement);

    const textDivHeaderC2 = document.createElement('div');
    textDivHeaderC2.setAttribute('class', 'p-col-6');
    textDivHeaderC2.setAttribute('style', 'width: 45%');
    const inputNumberC = document.createElement('input');

    inputNumberC.setAttribute('class', 'custom-input');
    inputNumberC.setAttribute('id', 'userInputcsC');
    inputNumberC.setAttribute('type', 'number');
    textDivHeaderC2.appendChild(inputNumberC);
    $(this.initialInputPanel.container)
      .find('#NuserInputcsC')[0]
      .appendChild(textDivHeaderC2 as HTMLElement);

    const textDivHeaderD1 = document.createElement('div');
    textDivHeaderD1.setAttribute('class', 'p-col-6');
    textDivHeaderD1.setAttribute('style', 'width: 45%');
    textDivHeaderD1.innerHTML =
      '<div class="box-section-new">' +
      'Crew Size of Stripping Formwork [ppl]' +
      '</div>';
    textDivHeaderD1.style.color = 'black';
    $(this.initialInputPanel.container)
      .find('#NuserInputcsS')[0]
      .appendChild(textDivHeaderD1 as HTMLElement);

    const textDivHeaderD2 = document.createElement('div');
    textDivHeaderD2.setAttribute('class', 'p-col-6');
    textDivHeaderD2.setAttribute('style', 'width: 45%');
    const inputNumberD = document.createElement('input');

    inputNumberD.setAttribute('class', 'custom-input');
    inputNumberD.setAttribute('id', 'userInputcsS');
    inputNumberD.setAttribute('type', 'number');
    textDivHeaderD2.appendChild(inputNumberD);
    $(this.initialInputPanel.container)
      .find('#NuserInputcsS')[0]
      .appendChild(textDivHeaderD2 as HTMLElement);

    const textDivHeaderAA1 = document.createElement('div');
    textDivHeaderAA1.setAttribute('class', 'p-col-6');
    textDivHeaderAA1.setAttribute('style', 'width: 45%');
    textDivHeaderAA1.innerHTML =
      '<div class="box-section-new">' +
      'Production rate of Installing Formwork [h/m2]' +
      '</div>';
    textDivHeaderAA1.style.color = 'black';
    $(this.initialInputPanel.container)
      .find('#NuserInputprF')[0]
      .appendChild(textDivHeaderAA1 as HTMLElement);

    const textDivHeaderAA2 = document.createElement('div');
    textDivHeaderAA2.setAttribute('class', 'p-col-6');
    textDivHeaderAA2.setAttribute('style', 'width: 45%');
    const inputNumberAA = document.createElement('input');

    inputNumberAA.setAttribute('class', 'custom-input');
    inputNumberAA.setAttribute('id', 'userInputprF');
    inputNumberAA.setAttribute('type', 'number');
    textDivHeaderAA2.appendChild(inputNumberAA);
    $(this.initialInputPanel.container)
      .find('#NuserInputprF')[0]
      .appendChild(textDivHeaderAA2 as HTMLElement);

    const textDivHeaderBB1 = document.createElement('div');
    textDivHeaderBB1.setAttribute('class', 'p-col-6');
    textDivHeaderBB1.setAttribute('style', 'width: 45%');
    textDivHeaderBB1.innerHTML =
      '<div class="box-section-new">' +
      'Production rate of Installing Reinforcement [h/t]' +
      '</div>';
    textDivHeaderBB1.style.color = 'black';
    $(this.initialInputPanel.container)
      .find('#NuserInputprR')[0]
      .appendChild(textDivHeaderBB1 as HTMLElement);

    const textDivHeaderBB2 = document.createElement('div');
    textDivHeaderBB2.setAttribute('class', 'p-col-6');
    textDivHeaderBB2.setAttribute('style', 'width: 45%');
    const inputNumberBB = document.createElement('input');

    inputNumberBB.setAttribute('class', 'custom-input');
    inputNumberBB.setAttribute('id', 'userInputprR');
    inputNumberBB.setAttribute('type', 'number');
    textDivHeaderBB2.appendChild(inputNumberBB);
    $(this.initialInputPanel.container)
      .find('#NuserInputprR')[0]
      .appendChild(textDivHeaderBB2 as HTMLElement);

    const textDivHeaderCC1 = document.createElement('div');
    textDivHeaderCC1.setAttribute('class', 'p-col-6');
    textDivHeaderCC1.setAttribute('style', 'width: 45%');
    textDivHeaderCC1.innerHTML =
      '<div class="box-section-new">' +
      'Production rate of Pouring Concrete [h/m3]' +
      '</div>';
    textDivHeaderCC1.style.color = 'black';
    $(this.initialInputPanel.container)
      .find('#NuserInputprC')[0]
      .appendChild(textDivHeaderCC1 as HTMLElement);

    const textDivHeaderCC2 = document.createElement('div');
    textDivHeaderCC2.setAttribute('class', 'p-col-6');
    textDivHeaderCC2.setAttribute('style', 'width: 45%');
    const inputNumberCC = document.createElement('input');

    inputNumberCC.setAttribute('class', 'custom-input');
    inputNumberCC.setAttribute('id', 'userInputprC');
    inputNumberCC.setAttribute('type', 'number');
    textDivHeaderCC2.appendChild(inputNumberCC);
    $(this.initialInputPanel.container)
      .find('#NuserInputprC')[0]
      .appendChild(textDivHeaderCC2 as HTMLElement);

    const textDivHeaderDD1 = document.createElement('div');
    textDivHeaderDD1.setAttribute('class', 'p-col-6');
    textDivHeaderDD1.setAttribute('style', 'width: 45%');
    textDivHeaderDD1.innerHTML =
      '<div class="box-section-new">' +
      'Production rate of Stripping Formwork [h/m2]' +
      '</div>';
    textDivHeaderDD1.style.color = 'black';
    $(this.initialInputPanel.container)
      .find('#NuserInputprS')[0]
      .appendChild(textDivHeaderDD1 as HTMLElement);

    const DtextDivHeaderDD2 = document.createElement('div');
    DtextDivHeaderDD2.setAttribute('class', 'p-col-6');
    DtextDivHeaderDD2.setAttribute('style', 'width: 45%');
    const inputNumberDD = document.createElement('input');

    inputNumberDD.setAttribute('class', 'custom-input');
    inputNumberDD.setAttribute('id', 'userInputprS');
    inputNumberDD.setAttribute('type', 'number');
    DtextDivHeaderDD2.appendChild(inputNumberDD);
    $(this.initialInputPanel.container)
      .find('#NuserInputprS')[0]
      .appendChild(DtextDivHeaderDD2 as HTMLElement);
  }

  public async runDifferentFunc() {
    $('.lds-roller').show();
    // SetTimeout only for vizualization purposes
    setTimeout(async () => {
      const allDbIds = this.getAllDbIds();
      await this.storeLevelObjects().then(async () => {
        await this.storeConcreteElements().then(async () => {
          $('canvas').show();
          $('.lds-roller').hide();
          // if (
          //   Utils.getColumns() &&
          //   Utils.getFoundations() &&
          //   Utils.getSlabs() &&
          //   Utils.getWalls()
          // ) {
          // this.columns = Utils.getColumns();
          // this.foundations = Utils.getFoundations();
          // this.slabs = Utils.getSlabs();
          // this.walls = Utils.getWalls();
          // $('canvas').show();
          // $('.lds-roller').hide();
          // return null;
          // }
          await this.storeCategoryObjects().then(async () => {
            console.log('storeCategoryObjects');
            // console.log(this.columns);
            // console.log(this.slabs);
            // console.log(this.walls);
            // Integrate here the database connection
            await this.getAndSetProperties(this.slabs).then(async () => {
              await this.getAndSetProperties(this.walls).then(async () => {
                await this.getAndSetProperties(this.columns).then(async () => {
                  this.setfixedPRAndCS(this.slabs);
                  this.setfixedPRAndCS(this.walls);
                  this.setfixedPRAndCS(this.columns);
                  this.calcWD(this.slabs);
                  this.calcWD(this.walls);
                  this.calcWD(this.columns);
                  this.storeSlabsPerLevel();
                  this.storeWallsPerLevel();
                  // Store Objects to localstorage
                  // Utils.setColumns(this.columns);
                  // Utils.setFoundations(this.foundations);
                  // Utils.setSlabs(this.slabs);
                  // Utils.setWalls(this.walls);
                  console.log('finished');
                  // $('canvas').show();
                  // $('.lds-roller').hide();
                  // console.log(this.walls);
                  // console.log(this.slabs);
                  // console.log(this.columns);
                  // this.workDensityColorMap();
                  // this.storeCategoryObjects();
                });
              });
            });
          });
        });
      });
    }, 1000);
  }

  public async getBulkProperties(ids: number[], propFilter: string[]) {
    return new Promise((resolve, rejected) => {
      this.viewerComponent.viewer.model.getBulkProperties(
        ids,
        propFilter,
        (data) => {
          resolve(data);
        },
        (err) => {
          rejected(err);
        }
      );
    });
  }

  public async getProperties(dbId: number) {
    return new Promise((resolve, rejected) => {
      this.viewerComponent.viewer.getProperties(
        dbId,
        (data) => {
          resolve(data);
        },
        (err) => {
          rejected(err);
        }
      );
    });
  }

  public async search(text: string, attributeNames: string) {
    return new Promise((resolve, rejected) => {
      this.viewerComponent.viewer.search(
        text,
        (data) => {
          resolve(data);
        },
        (err) => {
          rejected(err);
        },
        [attributeNames]
      );
    });
  }

  public async storeLevelObjects(): Promise<boolean> {
    const allDbIds = this.getAllDbIds();
    return await this.getBulkProperties(allDbIds, [
      'LcOaNode:LcOaNodeLayer',
    ]).then((res) => {
      const allValues = new Array();
      return asyncForEach(res, (element) => {
        allValues.push(element.properties[0].displayValue);
      }).then(() => {
        const unique = allValues.filter(
          (item, i, ar) => ar.indexOf(item) === i
        );
        return asyncForEach(unique, async (level) => {
          await this.search(level, 'LcOaNode:LcOaNodeLayer').then((idArray) => {
            this.objectsPerLevel.push({
              levelName: level,
              dbIds: idArray,
              id: this.makeid(5),
            });
          });
        }).then(() => {
          return true;
        });
      });
    });
  }

  public async storeConcreteElements(): Promise<boolean> {
    const allDbIds = this.getAllDbIds();
    return await this.getBulkProperties(allDbIds, [
      'LcOaNode:LcOaNodeMaterial',
    ]).then((res) => {
      const allValues = new Array();
      return asyncForEach(res, (element) => {
        allValues.push(element.properties[0].displayValue);
      }).then(() => {
        const uniqMat = allValues.filter(
          (item, i, ar) => ar.indexOf(item) === i
        );
        const concrValues = uniqMat.filter((item) =>
          item.includes('hbt_Beton')
        );
        // console.log(concrValues);
        return asyncForEach(concrValues, async (value) => {
          // console.log(value);
          // search is not case sensitive IMP_BETON includes all objects from IMP_BETON_Fertigteil
          await this.search(value, 'LcOaNode:LcOaNodeMaterial').then(
            (idArray) => {
              // console.log(idArray);
              this.concrObj.push({
                materialName: value,
                dbIds: idArray,
                id: this.makeid(5),
              });
            }
          );
        }).then(() => {
          return true;
        });
      });
    });
  }

  public async storeCategoryObjects() {
    const allDbIds = this.getAllDbIds();
    return await this.getBulkProperties(allDbIds, [
      'Kategorie',
      'Material',
    ]).then((res) => {
      // console.log(allDbIds);
      if (Array.isArray(res)) {
        const resNew = res.filter((item) => item.properties.length > 1);
        return asyncForEach(resNew, (element) => {
          // console.log(element);
          if (
            element.properties[0].displayValue ===
            'hbt_Beton_Konstruktionsbeton' &&
            element.properties[1].displayValue === 'Wände'
          ) {
            const wall = new Wall(
              this.makeid(5),
              element.dbId,
              this.getLeafComponentsRec(element.dbId)
            );
            wall.category = 'Wall';
            // This step is necessary if properties (Material and Category) have values in both parents and clildren
            // for example a leaf component of slab has some values in Material and Category so it meets the requirements to form an Element
            // and then also the parent has exactly the same values so an identical second Element is created also
            if (!this.walls.find((x) => x.viewerdbId === wall.viewerdbId)) {
              this.walls.push(wall);
            }
          } else if (
<<<<<<< HEAD
            // element.properties[0].displayValue ===
            // 'hbt_Beton_Konstruktionsbeton' &&
=======
            element.properties[0].displayValue ===
            'hbt_Beton_Konstruktionsbeton' &&
>>>>>>> d03d98cc36170cd5324597c63019d8a27e8151e5
            element.properties[1].displayValue === 'Geschossdecken'
          ) {
            const slab = new Slab(
              this.makeid(5),
              element.dbId,
              this.getLeafComponentsRec(element.dbId)
            );
            slab.category = 'Slab';
            if (!this.slabs.find((x) => x.viewerdbId === slab.viewerdbId)) {
              this.slabs.push(slab);
            }
          } else if (
            element.properties[0].displayValue ===
            'hbt_Beton_Konstruktionsbeton' &&
            element.properties[1].displayValue === 'Tragwerksstützen'
          ) {
            const column = new Column(
              this.makeid(5),
              element.dbId,
              // element.dbId
              this.getLeafComponentsRec(element.dbId)
            );
            column.category = 'Column';
            if (!this.columns.find((x) => x.viewerdbId === column.viewerdbId)) {
              this.columns.push(column);
            }
          }
        }).then(async () => {
          return await this.getBulkProperties(allDbIds, [
            'PREDEFINEDTYPE',
            'Material',
          ]).then((res) => {
            if (Array.isArray(res)) {
              const resNew = res.filter((item) => item.properties.length > 1);
              asyncForEach(resNew, (element) => {
                if (
                  element.properties[0].displayValue ===
                  'hbt_Beton_Konstruktionsbeton' &&
                  element.properties[1].displayValue === 'ROOF'
                ) {
                  const slab = new Slab(
                    this.makeid(5),
                    element.dbId,
                    this.getLeafComponentsRec(element.dbId)
                  );
                  slab.category = 'Slab';
                  this.slabs.push(slab);
                }
              }).then(() => {
                return true;
              });
            }
          });
        });
      }
    });
  }

  public getAllDbIds() {
    const instanceTree = this.viewerComponent.viewer.model.getData()
      .instanceTree;
    const allDbIdsStr = Object.keys(instanceTree.nodeAccess.dbIdToIndex);
    // tslint:disable-next-line: radix
    return allDbIdsStr.map((id) => parseInt(id));
  }

  public makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  public makeZoneid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  public async getAndSetProperties(categoryitems) {
    return await asyncForEach(categoryitems, async (item) => {
      return await this.getBulkProperties([item.dbId], null).then(
        async (data) => {
          return await asyncForEach(data, async (element) => {
            return await asyncForEach(element.properties, (prop) => {
              if (
                // prop.displayName === 'NetVolume' ||
                prop.displayName === 'Volumen'
              ) {
                item.volume = parseFloat(prop.displayValue);
                // console.log(item);
              } else if (
                prop.displayName === 'GrossArea' || // GrossArea is taekn from Quantities,Area is taken from Dimensions, but it's the same value
                prop.displayName === 'Fläche' //
              ) {
                item.area = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'Dicke') {
                item.thickness = parseFloat(prop.displayValue);
              } else if (
                prop.displayName === 'Perimeter' ||
                prop.displayName === 'Umfang'
                // not all columns especially prefabricated have property perimeter
                // prop.displayName === 'Umfang_Kreis'
              ) {
                item.perimeter = parseFloat(prop.displayValue);
              } else if (
                prop.displayName === 'NetSideArea' || // the 2nd NetSideArea is the correct one, normally here id the GrossSideArea used
                prop.displayName === 'NetSideArea'
              ) {
                item.sideArea = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'Width') {
                item.width = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'Height') {
                item.height = parseFloat(prop.displayValue);
              } else if (
                prop.displayName === 'Length' &&
                // There is  for WALLS
                prop.displayCategory === 'Quantities'
              ) {
                item.length = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'Breite') {
                item.Breite = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'Tiefe') {
                item.Tiefe = parseFloat(prop.displayValue);
              } else if (!item.length && prop.displayName === 'Länge') {
                item.length = parseFloat(prop.displayValue);
              }
            }).then(() => {
              // console.log('End element.properties');
              return true;
            });
          }).then(() => {
            // console.log('2');
            return true;
          });
        }
      );
    }).then(() => {
      // console.log('9999999999999999');
      return true;
    });
  }

  public setfixedPRAndCS(category) {
    switch (category) {
      case this.walls:
        this.walls.forEach((element) => {
          element.csF = 3;
          element.csR = 3;
          element.csC = 3;
          element.csS = 3;
          element.prF = 0.45; // values taken from Semester Project
          element.prR = 9.2;
          element.prC = 0.32;
          element.prS = 0.4;
        });
        break;
      case this.columns:
        this.columns.forEach((element) => {
          element.csF = 3;
          element.csR = 3;
          element.csC = 3;
          element.csS = 3;
          element.prF = 0.24;
          element.prR = 11.9;
          element.prC = 2;
          element.prS = 0.2;
        });
        break;
      case this.slabs:
        this.slabs.forEach((element) => {
          element.csF = 3;
          element.csR = 3;
          element.csC = 3;
          element.csS = 3;
          element.prF = 0.55;
          element.prR = 8.6;
          element.prC = 0.67;
          element.prS = 0.5;
        });
        break;
      case this.foundations:
        this.foundations.forEach((element) => {
          element.csF = 3;
          element.csR = 3;
          element.csC = 3;
          element.csS = 3;
          element.prF = 0.12;
          element.prR = 16;
          element.prC = 0.14;
          element.prS = 0.12;
        });
    }
    return category;
  }

  public calcWD(category) {
    switch (category) {
      case this.walls:
        this.walls.forEach((element) => {
          element.WDwF =
            Math.round(
              ((2 *
                (element.sideArea + element.width * element.height) *
                element.prF) /
                element.csF +
                Number.EPSILON) *
                100
            ) / 100;
          element.WDwR =
            Math.round(
              ((0.085 * element.volume * element.prR) / element.csR +
                Number.EPSILON) *
                100
            ) / 100; // ?* 0.17tons/m3
          element.WDwC =
            Math.round(
              ((element.volume * element.prC) / element.csC + Number.EPSILON) *
                100
            ) / 100; // ?* tons
          element.WDwCR = 8; // 8hours= 1 day
          element.WDwS =
            Math.round(
              ((2 *
                (element.sideArea + element.width * element.height) *
                element.prS) /
                element.csS +
                Number.EPSILON) *
                100
            ) / 100;
        });
        break;
      case this.columns:
        this.columns.forEach((element) => {
          if (!element.perimeter) {
            element.perimeter = 2 * element.Breite * element.Tiefe;
          }
          element.WDcF =
            Math.round(
              ((element.perimeter * element.length * element.prF) /
                element.csF +
                Number.EPSILON) *
                100
            ) / 100;
          element.WDcR =
            Math.round(
              ((0.15 * element.volume * element.prR) / element.csR +
                Number.EPSILON) *
                100
            ) / 100;
          element.WDcC =
            Math.round(
              ((element.volume * element.prC) / element.csC + Number.EPSILON) *
                100
            ) / 100;
          element.WDcCR = 8; // 8hours= 1 day
          element.WDcS =
            Math.round(
              ((element.perimeter * element.length * element.prS) /
                element.csS +
                Number.EPSILON) *
                100
            ) / 100;
        });
        break;
      case this.slabs:
        this.slabs.forEach((element) => {
          if (!element.thickness) {
            element.thickness = element.width;
          }
          element.WDsF =
            Math.round(
              (((element.area + element.perimeter * element.thickness) *
                element.prF) /
                element.csF +
                Number.EPSILON) *
                100
            ) / 100;
          element.WDsR =
            Math.round(
              ((0.09 * element.volume * element.prR) / element.csR +
                Number.EPSILON) *
                100
            ) / 100;
          element.WDsC =
            Math.round(
              ((element.volume * element.prC) / element.csC + Number.EPSILON) *
                100
            ) / 100;
          element.WDsCR = 24; // 32hours= 4 days maybe this should be defined based on area?
          element.WDsS =
            Math.round(
              (((element.area + element.perimeter * element.thickness) *
                element.prS) /
                element.csS +
                Number.EPSILON) *
                100
            ) / 100;
        });
        break;
      case this.foundations:
        this.foundations.forEach((element) => {
          if (!element.thickness) {
            // roofs are slabs but they have the width property instead of thickness
            element.thickness = element.width;
          }
          element.WDfF =
            Math.round(
              (((element.area + element.perimeter * element.thickness) *
                element.prF) /
                element.csF +
                Number.EPSILON) *
                100
            ) / 100;
          element.WDfR =
            Math.round(
              ((0.12 * element.volume * element.prR) / element.csR +
                Number.EPSILON) *
                100
            ) / 100;
          element.WDfC =
            Math.round(
              ((element.volume * element.prC) / element.csC + Number.EPSILON) *
                100
            ) / 100;
          element.WDfCR = 32; // 32hours= 4 days maybe this should be defined based on area?
          element.WDfS =
            Math.round(
              (((element.area + element.perimeter * element.thickness) *
                element.prS) /
                element.csS +
                Number.EPSILON) *
                100
            ) / 100;
        });
    }
    return category;
  }

  public colorWdObjects(category, wd) {
    category.forEach((item) => {
      // wd = item[wd];
      // console.log(wd, item[wd]);
      // console.log(item.wd);
      // console.log('coloring started');
      // debugger;
      if (item[wd] <= 4) {
        //
        const color = new THREE.Vector4(255 / 256, 245 / 256, 204 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (4 < item[wd] && item[wd] <= 8) {
        //
        const color = new THREE.Vector4(255 / 256, 237 / 256, 160 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (8 < item[wd] && item[wd] <= 12) {
        //
        const color = new THREE.Vector4(254 / 256, 217 / 256, 118 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (12 < item[wd] && item[wd] <= 16) {
        //
        const color = new THREE.Vector4(254 / 256, 178 / 256, 76 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (16 < item[wd] && item[wd] <= 20) {
        //
        const color = new THREE.Vector4(253 / 256, 141 / 256, 60 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (20 < item[wd] && item[wd] <= 24) {
        //
        const color = new THREE.Vector4(252 / 256, 78 / 256, 42 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (24 < item[wd] && item[wd] <= 28) {
        //
        const color = new THREE.Vector4(227 / 256, 26 / 256, 28 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (28 < item[wd] && item[wd] <= 32) {
        //
        const color = new THREE.Vector4(189 / 256, 0 / 256, 38 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (32 < item[wd] && item[wd] <= 36) {
        //
        const color = new THREE.Vector4(128 / 256, 0 / 256, 38 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (36 < item[wd] && item[wd] <= 40) {
        //
        const color = new THREE.Vector4(103 / 256, 0 / 256, 13 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (40 < item[wd]) {
        //
        const color = new THREE.Vector4(37 / 256, 37 / 256, 37 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbId,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
    });
  }

  public async workDensityColorMap() {
    // console.log('walls');
    this.colorWdObjects(this.walls, 'WDwCR');
    // console.log('columns');
    this.colorWdObjects(this.columns, 'WDcCR');
    // console.log('slabs');
    this.colorWdObjects(this.slabs, 'WDsCR');
    // this.colorWdObjects(this.foundations, 'WDfCR');
  }

  public showPropLegend() {
    const container = this.viewerComponent.viewer.container as HTMLElement;
    this.panel = new Autodesk.Viewing.UI.DockingPanel(
      container,
      'categoryLegend',
      'Properties Legend',
      { localizeTitle: true, addFooter: true }
    );
    this.panel.setVisible(true);
    this.panel.content = document.createElement('div');
    const contentDiv = this.panel.content as HTMLElement;
    contentDiv.classList.add('container', 'border-box');
    contentDiv.style.boxSizing = 'border-box';
    // html imported from ./legendTemplate.html
    $(this.panel.content).append(html);
    contentDiv.style.marginLeft = '10px';
    contentDiv.style.overflowY = 'scroll';
    contentDiv.style.overflowX = 'hidden';
    contentDiv.style.height = 'calc(100% - 90px)';
    contentDiv.style.color = 'black';
    this.panel.container.classList.add('docking-panel-container-solid-color-a');
    this.panel.container.style.height = '350px';
    this.panel.container.style.width = '600px';
    this.panel.container.style.minWidth = '600px';
    this.panel.container.style.resize = 'none';

    // FOOTER ==> Orginal Grösse 20 px
    // this.panel.footer.style.height = '40px';
    // this.panel.footer.style.paddingLeft = '14px';
    // this.panel.footer.style.paddingTop = '10px';
    // var valuesDivFooter = document.createElement('div');
    // valuesDivFooter.setAttribute('class', 'p-grid');
    // valuesDivFooter.innerHTML =
    //   '<div class="p-col">' +
    //   'Number of Values: ' +
    //   valuesOfParameter.length.toString() +
    //   '</div>';
    // valuesDivFooter.innerHTML += '<div class="p-col-1">Sum: </div>';
    // valuesDivFooter.innerHTML +=
    //   '<div class="p-col-1" id="summedInputsColoring"></div>';
    // valuesDivFooter.innerHTML +=
    //   '<div class="p-col">' +
    //   'Total Elements: ' +
    //   this.inputs.length.toString() +
    //   '</div>';
    // this.panel.footer.append(valuesDivFooter as HTMLElement);

    this.panel.container.appendChild(this.panel.content as HTMLElement);

    const textDivHeader = document.createElement('div');
    textDivHeader.setAttribute('class', 'p-col-6');
    textDivHeader.innerHTML = '<div class="box">' + 'Property Name' + '</div>';
    textDivHeader.style.color = 'black';
    textDivHeader.style.fontWeight = '800';
    $(this.panel.container)
      .find('#headerLabel')[0]
      .appendChild(textDivHeader as HTMLElement);

    const textDivHeader2 = document.createElement('div');
    textDivHeader2.setAttribute('class', 'p-col-6');
    textDivHeader2.innerHTML =
      '<div class="box">' + 'Property Value' + '</div>';
    textDivHeader2.style.color = 'black';
    textDivHeader2.style.fontWeight = '800';
    $(this.panel.container)
      .find('#headerLabel')[0]
      .appendChild(textDivHeader2 as HTMLElement);

    const textDivA = document.createElement('div');
    textDivA.setAttribute('class', 'p-col-6');
    textDivA.innerHTML = '<div class="box">' + 'Id' + '</div>';
    textDivA.style.color = 'black';
    $(this.panel.container)
      .find('#idProp')[0]
      .appendChild(textDivA as HTMLElement);

    const textDivA2 = document.createElement('div');
    textDivA2.setAttribute('class', 'p-col-6');
    textDivA2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivA2.style.color = 'red';
    $(this.panel.container)
      .find('#idProp')[0]
      .appendChild(textDivA2 as HTMLElement);

    const textDivB = document.createElement('div');
    textDivB.setAttribute('class', 'p-col-6');
    textDivB.innerHTML = '<div class="box">' + 'dbId' + '</div>';
    textDivB.style.color = 'black';
    $(this.panel.container)
      .find('#dbIdProp')[0]
      .appendChild(textDivB as HTMLElement);

    const textDivB2 = document.createElement('div');
    textDivB2.setAttribute('class', 'p-col-6');
    textDivB2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivB2.style.color = 'red';
    $(this.panel.container)
      .find('#dbIdProp')[0]
      .appendChild(textDivB2 as HTMLElement);

    const textDivC = document.createElement('div');
    textDivC.setAttribute('class', 'p-col-6');
    textDivC.innerHTML = '<div class="box">' + 'Volume [m3]' + '</div>';
    textDivC.style.color = 'black';
    $(this.panel.container)
      .find('#volumeProp')[0]
      .appendChild(textDivC as HTMLElement);

    const textDivC2 = document.createElement('div');
    textDivC2.setAttribute('class', 'p-col-6');
    textDivC2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivC2.style.color = 'red';
    $(this.panel.container)
      .find('#volumeProp')[0]
      .appendChild(textDivC2 as HTMLElement);

    const textDivD = document.createElement('div');
    textDivD.setAttribute('class', 'p-col-6');
    textDivD.innerHTML = '<div class="box">' + 'Area [m2]' + '</div>';
    textDivD.style.color = 'black';
    $(this.panel.container)
      .find('#areaProp')[0]
      .appendChild(textDivD as HTMLElement);

    const textDivD2 = document.createElement('div');
    textDivD2.setAttribute('class', 'p-col-6');
    textDivD2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivD2.style.color = 'red';
    $(this.panel.container)
      .find('#areaProp')[0]
      .appendChild(textDivD2 as HTMLElement);

    const textDivE = document.createElement('div');
    textDivE.setAttribute('class', 'p-col-6');
    textDivE.innerHTML = '<div class="box">' + 'Length [m]' + '</div>';
    textDivE.style.color = 'black';
    $(this.panel.container)
      .find('#lengthProp')[0]
      .appendChild(textDivE as HTMLElement);

    const textDivE2 = document.createElement('div');
    textDivE2.setAttribute('class', 'p-col-6');
    textDivE2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivE2.style.color = 'red';
    $(this.panel.container)
      .find('#lengthProp')[0]
      .appendChild(textDivE2 as HTMLElement);

    const textDivF = document.createElement('div');
    textDivF.setAttribute('class', 'p-col-6');
    textDivF.innerHTML = '<div class="box">' + 'Height [m]' + '</div>';
    textDivF.style.color = 'black';
    $(this.panel.container)
      .find('#heightProp')[0]
      .appendChild(textDivF as HTMLElement);

    const textDivF2 = document.createElement('div');
    textDivF2.setAttribute('class', 'p-col-6');
    textDivF2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivF2.style.color = 'red';
    $(this.panel.container)
      .find('#heightProp')[0]
      .appendChild(textDivF2 as HTMLElement);

    const textDivG = document.createElement('div');
    textDivG.setAttribute('class', 'p-col-6');
    textDivG.innerHTML = '<div class="box">' + 'Perimeter [m]' + '</div>';
    textDivG.style.color = 'black';
    $(this.panel.container)
      .find('#perimProp')[0]
      .appendChild(textDivG as HTMLElement);

    const textDivG2 = document.createElement('div');
    textDivG2.setAttribute('class', 'p-col-6');
    textDivG2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivG2.style.color = 'red';
    $(this.panel.container)
      .find('#perimProp')[0]
      .appendChild(textDivG2 as HTMLElement);

    const textDivH = document.createElement('div');
    textDivH.setAttribute('class', 'p-col-6');
    textDivH.innerHTML = '<div class="box">' + 'Width [m]' + '</div>';
    textDivH.style.color = 'black';
    $(this.panel.container)
      .find('#widthProp')[0]
      .appendChild(textDivH as HTMLElement);

    const textDivH2 = document.createElement('div');
    textDivH2.setAttribute('class', 'p-col-6');
    textDivH2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivH2.style.color = 'red';
    $(this.panel.container)
      .find('#widthProp')[0]
      .appendChild(textDivH2 as HTMLElement);

    const textDivI = document.createElement('div');
    textDivI.setAttribute('class', 'p-col-6');
    textDivI.innerHTML =
      '<div class="box">' +
      'Production Rate Install Formwork [h/m2]' +
      '</div>';
    textDivI.style.color = 'black';
    $(this.panel.container)
      .find('#prFormProp')[0]
      .appendChild(textDivI as HTMLElement);

    const textDivI2 = document.createElement('div');
    textDivI2.setAttribute('class', 'p-col-6');
    textDivI2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivI2.style.color = 'red';
    $(this.panel.container)
      .find('#prFormProp')[0]
      .appendChild(textDivI2 as HTMLElement);

    const textDivY = document.createElement('div');
    textDivY.setAttribute('class', 'p-col-6');
    textDivY.innerHTML =
      '<div class="box">' +
      'Production Rate Install Reinforcement [h/t]' +
      '</div>';
    textDivY.style.color = 'black';
    $(this.panel.container)
      .find('#prReinProp')[0]
      .appendChild(textDivY as HTMLElement);

    const textDivY2 = document.createElement('div');
    textDivY2.setAttribute('class', 'p-col-6');
    textDivY2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivY2.style.color = 'red';
    $(this.panel.container)
      .find('#prReinProp')[0]
      .appendChild(textDivY2 as HTMLElement);

    const textDivT = document.createElement('div');
    textDivT.setAttribute('class', 'p-col-6');
    textDivT.innerHTML =
      '<div class="box">' + 'Production Rate Pour Concrete [h/m3]' + '</div>';
    textDivT.style.color = 'black';
    $(this.panel.container)
      .find('#prConcProp')[0]
      .appendChild(textDivT as HTMLElement);

    const textDivT2 = document.createElement('div');
    textDivT2.setAttribute('class', 'p-col-6');
    textDivT2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivT2.style.color = 'red';
    $(this.panel.container)
      .find('#prConcProp')[0]
      .appendChild(textDivT2 as HTMLElement);

    const textDivU = document.createElement('div');
    textDivU.setAttribute('class', 'p-col-6');
    textDivU.innerHTML =
      '<div class="box">' + 'Production Rate Strip Formwork [h/m2]' + '</div>';
    textDivU.style.color = 'black';
    $(this.panel.container)
      .find('#prStrProp')[0]
      .appendChild(textDivU as HTMLElement);

    const textDivU2 = document.createElement('div');
    textDivU2.setAttribute('class', 'p-col-6');
    textDivU2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivU2.style.color = 'red';
    $(this.panel.container)
      .find('#prStrProp')[0]
      .appendChild(textDivU2 as HTMLElement);

    const textDivK = document.createElement('div');
    textDivK.setAttribute('class', 'p-col-6');
    textDivK.innerHTML =
      '<div class="box">' + 'Crew Size Install Formwork [ppl]' + '</div>';
    textDivK.style.color = 'black';
    $(this.panel.container)
      .find('#csFormProp')[0]
      .appendChild(textDivK as HTMLElement);

    const textDivK2 = document.createElement('div');
    textDivK2.setAttribute('class', 'p-col-6');
    textDivK2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivK2.style.color = 'red';
    $(this.panel.container)
      .find('#csFormProp')[0]
      .appendChild(textDivK2 as HTMLElement);

    const textDivL = document.createElement('div');
    textDivL.setAttribute('class', 'p-col-6');
    textDivL.innerHTML =
      '<div class="box">' + 'Crew Size Install Reinforcement [ppl]' + '</div>';
    textDivL.style.color = 'black';
    $(this.panel.container)
      .find('#csReinProp')[0]
      .appendChild(textDivL as HTMLElement);

    const textDivL2 = document.createElement('div');
    textDivL2.setAttribute('class', 'p-col-6');
    textDivL2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivL2.style.color = 'red';
    $(this.panel.container)
      .find('#csReinProp')[0]
      .appendChild(textDivL2 as HTMLElement);

    const textDivM = document.createElement('div');
    textDivM.setAttribute('class', 'p-col-6');
    textDivM.innerHTML =
      '<div class="box">' + 'Crew Size Pour Concrete [ppl]' + '</div>';
    textDivM.style.color = 'black';
    $(this.panel.container)
      .find('#csConcProp')[0]
      .appendChild(textDivM as HTMLElement);

    const textDivM2 = document.createElement('div');
    textDivM2.setAttribute('class', 'p-col-6');
    textDivM2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivM2.style.color = 'red';
    $(this.panel.container)
      .find('#csConcProp')[0]
      .appendChild(textDivM2 as HTMLElement);

    const textDivO = document.createElement('div');
    textDivO.setAttribute('class', 'p-col-6');
    textDivO.innerHTML =
      '<div class="box">' + 'Crew Size Strip Formwork [ppl]' + '</div>';
    textDivO.style.color = 'black';
    $(this.panel.container)
      .find('#csStrProp')[0]
      .appendChild(textDivO as HTMLElement);

    const textDivO2 = document.createElement('div');
    textDivO2.setAttribute('class', 'p-col-6');
    textDivO2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivO2.style.color = 'red';
    $(this.panel.container)
      .find('#csStrProp')[0]
      .appendChild(textDivO2 as HTMLElement);

    const textDivJ = document.createElement('div');
    textDivJ.setAttribute('class', 'p-col-6');
    textDivJ.innerHTML =
      '<div class="box">' + 'Work Density Install Formwork [h]' + '</div>';
    textDivJ.style.color = 'black';
    $(this.panel.container)
      .find('#wdFormProp')[0]
      .appendChild(textDivJ as HTMLElement);

    const textDivJ2 = document.createElement('div');
    textDivJ2.setAttribute('class', 'p-col-6');
    textDivJ2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivJ2.style.color = 'red';
    $(this.panel.container)
      .find('#wdFormProp')[0]
      .appendChild(textDivJ2 as HTMLElement);

    const textDivP = document.createElement('div');
    textDivP.setAttribute('class', 'p-col-6');
    textDivP.innerHTML =
      '<div class="box">' + 'Work Density Install Reinforcement [h]' + '</div>';
    textDivP.style.color = 'black';
    $(this.panel.container)
      .find('#wdReinProp')[0]
      .appendChild(textDivP as HTMLElement);

    const textDivP2 = document.createElement('div');
    textDivP2.setAttribute('class', 'p-col-6');
    textDivP2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivP2.style.color = 'red';
    $(this.panel.container)
      .find('#wdReinProp')[0]
      .appendChild(textDivP2 as HTMLElement);

    const textDivQ = document.createElement('div');
    textDivQ.setAttribute('class', 'p-col-6');
    textDivQ.innerHTML =
      '<div class="box">' + 'Work Density Pour Concrete [h]' + '</div>';
    textDivQ.style.color = 'black';
    $(this.panel.container)
      .find('#wdConcProp')[0]
      .appendChild(textDivQ as HTMLElement);

    const textDivQ2 = document.createElement('div');
    textDivQ2.setAttribute('class', 'p-col-6');
    textDivQ2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivQ2.style.color = 'red';
    $(this.panel.container)
      .find('#wdConcProp')[0]
      .appendChild(textDivQ2 as HTMLElement);

    const textDivR = document.createElement('div');
    textDivR.setAttribute('class', 'p-col-6');
    textDivR.innerHTML =
      '<div class="box">' + 'Work Density Curing of Concrete [h]' + '</div>';
    textDivR.style.color = 'black';
    $(this.panel.container)
      .find('#wdCurProp')[0]
      .appendChild(textDivR as HTMLElement);

    const textDivR2 = document.createElement('div');
    textDivR2.setAttribute('class', 'p-col-6');
    textDivR2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivR2.style.color = 'red';
    $(this.panel.container)
      .find('#wdCurProp')[0]
      .appendChild(textDivR2 as HTMLElement);

    const textDivS = document.createElement('div');
    textDivS.setAttribute('class', 'p-col-6');
    textDivS.innerHTML =
      '<div class="box">' + 'Work Density Strip Formwork [h]' + '</div>';
    textDivS.style.color = 'black';
    $(this.panel.container)
      .find('#wdStrProp')[0]
      .appendChild(textDivS as HTMLElement);

    const textDivS2 = document.createElement('div');
    textDivS2.setAttribute('class', 'p-col-6');
    textDivS2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivS2.style.color = 'red';
    $(this.panel.container)
      .find('#wdStrProp')[0]
      .appendChild(textDivS2 as HTMLElement);
  }
  // try to find all last children dbids
  public getAllLeafComponents(viewer, callback) {
    let cbCount = 0; // count pending callbacks
    const components = []; // store the results
    let tree; // the instance tree

    function getLeafComponentsRec(parent) {
      cbCount++;
      if (tree.getChildCount(parent) != 0) {
        tree.enumNodeChildren(
          parent,
          function (children) {
            getLeafComponentsRec(children);
            // console.log(children);
          },
          false
        );
      } else {
        components.push(parent);
        // console.log(components);
      }
      if (--cbCount == 0) callback(components);
    }
    viewer.getObjectTree(function (objectTree) {
      tree = objectTree;
      const allLeafComponents = getLeafComponentsRec(tree.getRootId());
    });
  }

  public getLeafComponentsRec(parent) {
    if (
      this.viewerComponent.viewer.model
        .getInstanceTree()
        .getChildCount(parent) !== 0
    ) {
      this.viewerComponent.viewer.model.getInstanceTree().enumNodeChildren(
        parent,
        (children) => {
          this.getLeafComponentsRec(children);
          // console.log(children);
        },
        false
      );
    } else {
      this.leafcomponents.push(parent);
      // console.log(this.leafcomponents);
    }
    // console.log(this.leafcomponents);
    return this.leafcomponents.slice(-1)[0];
  }

  public setupUI() {
    // info panel part
    const tempPanel = document.createElement('div');
    tempPanel.id = 'tempPanel';
    // tempPanel.className = "infoPanel";
    tempPanel.style.cssText = `
        left: 125px;
        bottom: 155px;
        min-width: 220px;
        // height: 300px;
        
        position: absolute;
        z-index: 2;
        padding: 10px;
        background-color: '#B8C6D1';
        box-shadow: 0px 0px 12px #D1C7B8;
        color: black;
        `;

    tempPanel.innerHTML = `
    <h4 style='text-align: center; padding: 0; margin:0; font-size:26px'>Color Map</h4>
    <!--<hr>-->
    <img src="assets/colorMap.png" alt="colorPalette" style="margin-bottom: 5px; margin-left: 5px;">
    <!--<hr>-->
    `;

    document.body.appendChild(tempPanel);
  }

  public isWall(id) {
    if (this.walls.find((el) => el.viewerdbId === id)) {
      return true;
    } else {
      return false;
    }
  }

  public isColumn(id) {
    if (this.columns.find((el) => el.viewerdbId === id)) {
      return true;
    } else {
      return false;
    }
  }

  public isSlab(id) {
    if (this.slabs.find((el) => el.viewerdbId === id)) {
      return true;
    } else {
      return false;
    }
  }

  public belongsToZone(selection) {
    let count = 0;
    this.zones.forEach((zone) => {
      selection.forEach((dbId) => {
        if (zone.dbIds.includes(dbId)) {
          count++;
        }
      });
    });
    // console.log(count);
    // console.log(selection.length);
    if (selection.length !== 0 && count !== 0) {
      return true;
    } else {
      return false;
    }
  }

  public belongsToAllZones(selection) {
    let count = 0;
    this.allZones.forEach((zone) => {
      selection.forEach((dbId) => {
        if (zone.dbIds.includes(dbId)) {
          count++;
        }
      });
    });
    // console.log(count);
    // console.log(selection.length);
    if (selection.length !== 0 && count !== 0) {
      return true;
    } else {
      return false;
    }
  }

  public isWDtoolbarAct(c1, c2, c3, c4, c5) {
    if (c1 === 0 || c2 === 0 || c3 === 0 || c4 === 0 || c5 === 0) {
      return true;
    } else {
      return false;
    }
  }

  public handleMouseMove(event) {
    const screenPoint = {
      x: event.clientX,
      y: event.clientY,
    };
    const hitTest = this.viewerComponent.viewer.impl.hitTest(
      screenPoint.x,
      screenPoint.y
    );
    // console.log(hitTest);

    if (hitTest !== null) {
      const hitPoint = hitTest.point;
    }
    return false;
  }

  public changePanelValue(dbIdArray) {
    if (this.isWall(dbIdArray[0])) {
      const correspondingWall = this.walls.find(
        (obj) => obj.viewerdbId === dbIdArray[0]
      );
      // console.log(correspondingWall);
      if (this.panel) {
        // @ts-ignore
        $(this.panel.container).find('#idProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.id + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#dbIdProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.dbId + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#volumeProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.volume.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#areaProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingWall.sideArea.toFixed(2) +
          '</div>';
        // @ts-ignore
        $(this.panel.container).find('#lengthProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.length.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#heightProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.height.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#perimProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + 'Unset' + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#widthProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.width.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.prF + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.prR + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.prC + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.prS + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.csF + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.csR + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.csC + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.csS + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.WDwF.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.WDwR.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.WDwC.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdCurProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.WDwCR.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.WDwS.toFixed(2) + '</div>';
      }
    } else if (this.isColumn(dbIdArray[0])) {
      const correspondingColumn = this.columns.find(
        (obj) => obj.viewerdbId === dbIdArray[0]
      );
      if (this.panel) {
        // @ts-ignore
        $(this.panel.container).find('#idProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.id + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#dbIdProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.dbId + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#volumeProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingColumn.volume.toFixed(2) +
          '</div>';
        // @ts-ignore
        $(this.panel.container).find('#areaProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + 'Unset' + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#lengthProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingColumn.length.toFixed(2) +
          '</div>';
        // @ts-ignore
        $(this.panel.container).find('#heightProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + 'Unset' + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#perimProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingColumn.perimeter.toFixed(2) +
          '</div>';
        // @ts-ignore
        $(this.panel.container).find('#widthProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + 'Unset' + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.prF + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.prR + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.prC + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.prS + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.csF + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.csR + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.csC + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.csS + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.WDcF.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.WDcR.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.WDcC.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdCurProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.WDcCR.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingColumn.WDcS.toFixed(2) + '</div>';
      }
    } else if (this.isSlab(dbIdArray[0])) {
      const correspondingSlab = this.slabs.find(
        (obj) => obj.viewerdbId === dbIdArray[0]
      );
      if (this.panel) {
        // @ts-ignore
        $(this.panel.container).find('#idProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.id + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#dbIdProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.dbId + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#volumeProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.volume.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#areaProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.area.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#lengthProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + 'Unset' + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#heightProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + 'Unset' + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#perimProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingSlab.perimeter.toFixed(2) +
          '</div>';
        // @ts-ignore
        $(this.panel.container).find('#widthProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingSlab.thickness.toFixed(2) + // slabs have thickness instead of width
          '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.prF + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.prR + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.prC + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#prStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.prS + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.csF + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.csR + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.csC + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#csStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.csS + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdFormProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.WDsF.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdReinProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.WDsR.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdConcProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.WDsC.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdCurProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.WDsCR.toFixed(2) + '</div>';
        // @ts-ignore
        $(this.panel.container).find('#wdStrProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.WDsS.toFixed(2) + '</div>';
      }
    }
  }

  public computeWDbars(selection, zone) {
    zone.wdF = 0;
    zone.wdR = 0;
    zone.wdC = 0;
    zone.wdCR = 0;
    zone.wdS = 0;
    selection.forEach((dbId) => {
      // console.log(props)
      this.columns.find((column) => {
        if (column.viewerdbId === dbId) {
          zone.objects.push(column);
        }
      });
      this.walls.find((wall) => {
        if (wall.viewerdbId === dbId) {
          zone.objects.push(wall);
        }
      });
      this.slabs.find((slab) => {
        if (slab.viewerdbId === dbId) {
          zone.objects.push(slab);
        }
      });
      zone.dbIds.push(dbId);
      // assign levelName to class Zone temporary solution
      // because its doing it for every dbId, maybe if Zone[level]
      // was an array we could throw an error if !allEntries were the same
      // since all objects of a zone should be at the same level

      const correspondingLevel = this.objectsPerLevel.find((obj) =>
        obj.dbIds.includes(dbId)
      );
      // console.log(correspondingLevel);
      zone.level = correspondingLevel.levelName;
      // FORMWORK
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdF += correspondingWall.WDwF;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdF += correspondingColumn.WDcF;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdF += correspondingSlab.WDsF;
      }
      // REINFORCEMENT
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdR += correspondingWall.WDwR;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdR += correspondingColumn.WDcR;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdR += correspondingSlab.WDsR;
      }
      // CONCRETE
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdC += correspondingWall.WDwC;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdC += correspondingColumn.WDcC;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdC += correspondingSlab.WDsC;
      }
      // CURING
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdCR = correspondingWall.WDwCR;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdCR = correspondingColumn.WDcCR;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdCR = correspondingSlab.WDsCR;
      }
      // STRIP
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdS += correspondingWall.WDwS;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdS += correspondingColumn.WDcS;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdS += correspondingSlab.WDsS;
      }
      const color = new THREE.Vector4(0 / 256, 128 / 256, 0 / 256, 1);
      this.viewerComponent.viewer.setThemingColor(
        dbId,
        color,
        this.viewerComponent.viewer.model,
        true
      );
    });
    this.allZones.push(zone);
  }

  public updateWDbars(selection, zone) {
    zone.wdF = 0;
    zone.wdR = 0;
    zone.wdC = 0;
    zone.wdCR = 0;
    zone.wdS = 0;
    selection.forEach((dbId) => {
      // FORMWORK
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdF += correspondingWall.WDwF;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdF += correspondingColumn.WDcF;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdF += correspondingSlab.WDsF;
      }
      // REINFORCEMENT
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdR += correspondingWall.WDwR;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdR += correspondingColumn.WDcR;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdR += correspondingSlab.WDsR;
      }
      // CONCRETE
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdC += correspondingWall.WDwC;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdC += correspondingColumn.WDcC;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdC += correspondingSlab.WDsC;
      }
      // CURING
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdCR = correspondingWall.WDwCR;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdCR = correspondingColumn.WDcCR;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdCR = correspondingSlab.WDsCR;
      }
      // STRIP
      if (this.isWall(dbId)) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdS += correspondingWall.WDwS;
      }
      if (this.isColumn(dbId)) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdS += correspondingColumn.WDcS;
      }
      if (this.isSlab(dbId)) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wdS += correspondingSlab.WDsS;
      }
    });
  }

  public compute1tradeWDbars(selection, zone) {
    zone.wd = 0;
    const wdControlGroup = this.viewerComponent.viewer.toolbar.getControl(
      'my-custom-toolbar-WD-controlgroup'
    );
    // @ts-ignore
    const controlInstFormwork = wdControlGroup._controls[0].getState();
    // console.log(controlInstFormwork);
    // @ts-ignore
    const controlInstReinforcement = wdControlGroup._controls[1].getState();
    // @ts-ignore
    const controlPourConcrete = wdControlGroup._controls[2].getState();
    // @ts-ignore
    const controlCuring = wdControlGroup._controls[3].getState();
    // @ts-ignore
    const controlStripFormwork = wdControlGroup._controls[4].getState();
    selection.forEach((dbId) => {
      // console.log(props)
      // Store the
      this.columns.find((column) => {
        if (column.viewerdbId === dbId) {
          zone.objects.push(column);
        }
      });
      this.walls.find((wall) => {
        if (wall.viewerdbId === dbId) {
          zone.objects.push(wall);
        }
      });
      this.slabs.find((slab) => {
        if (slab.viewerdbId === dbId) {
          zone.objects.push(slab);
        }
      });
      zone.dbIds.push(dbId);
      //assign levelName to class Zone temporary solution
      // because its doing it for every dbId, maybe if Zone[level]
      //was an array we could throw an error if !allEntries were the same
      // since all objects of a zone should be at the same level

      const correspondingLevel = this.objectsPerLevel.find((obj) =>
        obj.dbIds.includes(dbId)
      );
      // console.log(correspondingLevel);
      zone.level = correspondingLevel.levelName;
      //Case 1: Install Formwork
      if (this.isWall(dbId) && controlInstFormwork === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwF;
      }
      if (this.isColumn(dbId) && controlInstFormwork === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcF;
      }
      if (this.isSlab(dbId) && controlInstFormwork === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsF;
      }
      //Case 2: Install Reinforcemenr
      if (this.isWall(dbId) && controlInstReinforcement === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwR;
      }
      if (this.isColumn(dbId) && controlInstReinforcement === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcR;
      }
      if (this.isSlab(dbId) && controlInstReinforcement === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsR;
      }
      //Case 3: Pour Concrete
      if (this.isWall(dbId) && controlPourConcrete === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwC;
      }
      if (this.isColumn(dbId) && controlPourConcrete === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcC;
      }
      if (this.isSlab(dbId) && controlPourConcrete === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsC;
      }
      //Case 4: Curing of Concrete
      if (this.isWall(dbId) && controlCuring === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwCR;
      }
      if (this.isColumn(dbId) && controlCuring === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcCR;
      }
      if (this.isSlab(dbId) && controlCuring === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsCR;
      }
      //Case 5: Strip Formwork
      if (this.isWall(dbId) && controlStripFormwork === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwS;
      }
      if (this.isColumn(dbId) && controlStripFormwork === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcS;
      }
      if (this.isSlab(dbId) && controlStripFormwork === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsS;
      }

      const color = new THREE.Vector4(144 / 256, 144 / 256, 238 / 256, 1);
      this.viewerComponent.viewer.setThemingColor(
        dbId,
        color,
        this.viewerComponent.viewer.model,
        true
      );
    });
    this.zones.push(zone);
  }

  public update1tradeWDbars(selection, zone) {
    zone.wd = 0;
    const wdControlGroup = this.viewerComponent.viewer.toolbar.getControl(
      'my-custom-toolbar-WD-controlgroup'
    );
    // @ts-ignore
    const controlInstFormwork = wdControlGroup._controls[0].getState();
    // console.log(controlInstFormwork);
    // @ts-ignore
    const controlInstReinforcement = wdControlGroup._controls[1].getState();
    // @ts-ignore
    const controlPourConcrete = wdControlGroup._controls[2].getState();
    // @ts-ignore
    const controlCuring = wdControlGroup._controls[3].getState();
    // @ts-ignore
    const controlStripFormwork = wdControlGroup._controls[4].getState();

    selection.forEach((dbId) => {
      //Case 1: Install Formwork
      if (this.isWall(dbId) && controlInstFormwork === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwF;
      }
      if (this.isColumn(dbId) && controlInstFormwork === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcF;
      }
      if (this.isSlab(dbId) && controlInstFormwork === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsF;
      }
      //Case 2: Install Reinforcemenr
      if (this.isWall(dbId) && controlInstReinforcement === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwR;
      }
      if (this.isColumn(dbId) && controlInstReinforcement === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcR;
      }
      if (this.isSlab(dbId) && controlInstReinforcement === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsR;
      }
      //Case 3: Pour Concrete
      if (this.isWall(dbId) && controlPourConcrete === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwC;
      }
      if (this.isColumn(dbId) && controlPourConcrete === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcC;
      }
      if (this.isSlab(dbId) && controlPourConcrete === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsC;
      }
      //Case 4: Curing of Concrete
      if (this.isWall(dbId) && controlCuring === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwCR;
      }
      if (this.isColumn(dbId) && controlCuring === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcCR;
      }
      if (this.isSlab(dbId) && controlCuring === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsCR;
      }
      //Case 5: Strip Formwork
      if (this.isWall(dbId) && controlStripFormwork === 0) {
        const correspondingWall = this.walls.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingWall.WDwS;
      }
      if (this.isColumn(dbId) && controlStripFormwork === 0) {
        const correspondingColumn = this.columns.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingColumn.WDcS;
      }
      if (this.isSlab(dbId) && controlStripFormwork === 0) {
        const correspondingSlab = this.slabs.find(
          (obj) => obj.viewerdbId === dbId
        );

        zone.wd += correspondingSlab.WDsS;
      }
    });
  }

  public createAndUpdateBarChart() {
    this.allTradesBarchart.chart.data.datasets[0].data = [];
    this.allTradesBarchart.chart.data.labels = [];
    this.allTradesBarchart.chart.data.datasets[1].data = [];

    this.allTradesBarchart.chart.data.datasets[2].data = [];

    this.allTradesBarchart.chart.data.datasets[3].data = [];

    this.allTradesBarchart.chart.data.datasets[4].data = [];

    this.allZones.forEach((z) => {
      this.allTradesBarchart.chart.data.datasets[0].data.push(z.wdF);
      this.allTradesBarchart.chart.data.labels.push(z.id);
      this.allTradesBarchart.chart.data.datasets[1].data.push(z.wdR);

      this.allTradesBarchart.chart.data.datasets[2].data.push(z.wdC);

      this.allTradesBarchart.chart.data.datasets[3].data.push(z.wdCR);

      this.allTradesBarchart.chart.data.datasets[4].data.push(z.wdS);
    });
    this.allTradesBarchart.chart.update();
  }

  public createAndUpdate1TradeBarChart() {
    const wdControlGroup = this.viewerComponent.viewer.toolbar.getControl(
      'my-custom-toolbar-WD-controlgroup'
    );
    // @ts-ignore
    const controlInstFormwork = wdControlGroup._controls[0].getState();
    // console.log(controlInstFormwork);
    // @ts-ignore
    const controlInstReinforcement = wdControlGroup._controls[1].getState();
    // @ts-ignore
    const controlPourConcrete = wdControlGroup._controls[2].getState();
    // @ts-ignore
    const controlCuring = wdControlGroup._controls[3].getState();
    // @ts-ignore
    const controlStripFormwork = wdControlGroup._controls[4].getState();
    if (controlInstFormwork === 0) {
      var dataSet = 0;
    } else if (controlInstReinforcement === 0) {
      var dataSet = 1;
    } else if (controlPourConcrete === 0) {
      var dataSet = 2;
    } else if (controlCuring === 0) {
      var dataSet = 3;
    } else if (controlStripFormwork === 0) {
      var dataSet = 4;
    }
    console.log(dataSet);

    this.tradeBarchart.chart.data.datasets[0].data = [];
    this.tradeBarchart.chart.data.datasets[1].data = [];
    this.tradeBarchart.chart.data.datasets[2].data = [];
    this.tradeBarchart.chart.data.datasets[3].data = [];
    this.tradeBarchart.chart.data.datasets[4].data = [];
    this.tradeBarchart.chart.data.labels = [];

    this.zones.forEach((z) => {
      this.tradeBarchart.chart.data.datasets[dataSet].data.push(z.wd);
      this.tradeBarchart.chart.data.labels.push(z.id);
    });
    this.tradeBarchart.chart.update();
  }

  // public exportDashboard() {
  //   var doc = new jsPDF('p', 'mm', 'a4');
  //   doc.addHTML(
  //     document.getElementById('dashboard'),
  //     15,
  //     15,
  //     { background: '#fff' },
  //     function () {
  //       doc.save('dashboard.pdf');
  //     }
  //   );
  // }

  public storeSlabsPerLevel() {
    this.slabs.forEach((slab) => {
      this.slabDbIds.push(slab.dbId);
    });
    this.objectsPerLevel.forEach((floor) => {
      // console.log(floor);
      this.slabsPerLevel.push({
        FloorName: floor.levelName,
        dbIds: floor.dbIds.filter((value) => this.slabDbIds.includes(value)),
        WDsPerFloorF: 0,
        WDsPerFloorR: 0,
        WDsPerFloorC: 0,
        WDsPerFloorS: 0,
        slabsTotalArea: 0,
      });
    });
    // console.log(this.slabsPerLevel);

    this.slabsPerLevel.forEach((level) => {
      level.dbIds.forEach((dbId) => {
        const correspondingSlab = this.slabs.find((obj) => obj.dbId === dbId);
        // console.log(correspondingSlab);
        level.WDsPerFloorF += correspondingSlab.WDsF;
        level.WDsPerFloorR += correspondingSlab.WDsR;
        level.WDsPerFloorC += correspondingSlab.WDsC;
        level.WDsPerFloorS += correspondingSlab.WDsS;
        level.slabsTotalArea += correspondingSlab.area;
      });
    });
  }
  public storeWallsPerLevel() {
    this.walls.forEach((wall) => {
      this.wallDbIds.push(wall.dbId);
    });
    this.objectsPerLevel.forEach((floor) => {
      // console.log(floor);
      this.wallsPerLevel.push({
        FloorName: floor.levelName,
        dbIds: floor.dbIds.filter((value) => this.wallDbIds.includes(value)),
        WDwPerFloorF: 0,
        WDwPerFloorR: 0,
        WDwPerFloorC: 0,
        WDwPerFloorS: 0,
        wallsTotalLength: 0,
      });
    });
    // console.log(this.wallsPerLevel);

    this.wallsPerLevel.forEach((level) => {
      level.dbIds.forEach((dbId) => {
        const correspondingWall = this.walls.find((obj) => obj.dbId === dbId);
        // console.log(correspondingWall);
        level.WDwPerFloorF += correspondingWall.WDwF;
        level.WDwPerFloorR += correspondingWall.WDwR;
        level.WDwPerFloorC += correspondingWall.WDwC;
        level.WDwPerFloorS += correspondingWall.WDwS;
        level.wallsTotalLength += correspondingWall.length;
      });
    });
  }
  public findStandardSlab() {
    this.slabsPerLevel.forEach((slab) => {
      let maxWDs = Math.max(
        slab.WDsPerFloorF,
        slab.WDsPerFloorR,
        slab.WDsPerFloorC,
        slab.WDsPerFloorS
      );
      // console.log(maxWDs);
      const maxWD = 35;
      let WDperm2 = maxWDs / slab.slabsTotalArea;
      // console.log(WDperm2);
      let standardSize = maxWD / WDperm2;
      // console.log(standardSize);

      slab.standardArea = standardSize;
      slab.slabsNumber = Math.round(slab.slabsTotalArea / standardSize);
    });
    this.slabsPerLevel.forEach((slab) => {
      slab.dbIds.forEach((dbId) => {
        const correspondingSlab = this.slabs.find((obj) => obj.dbId === dbId);
        if (correspondingSlab.area > slab.standardArea) {
          this.slabsToBeSplit.push(correspondingSlab.dbId);
        }
      });
    });
    this.slabsPerLevel.forEach((slab) => {
      if (slab.slabsNumber <= 1) {
        slab.standardArea = 'undefined';
        slab.slabsNumber = NaN;
      }
    });
    console.log(this.slabsPerLevel);
    console.log(this.slabsToBeSplit);
    // this.viewerComponent.viewer.isolate(this.slabsToBeSplit);
  }

  public findStandardWall() {
    this.wallsPerLevel.forEach((wall) => {
      let maxWDs = Math.max(
        wall.WDwPerFloorF,
        wall.WDwPerFloorR,
        wall.WDwPerFloorC,
        wall.WDwPerFloorS
      );
      // console.log(maxWDs);
      const maxWD = 35;
      let WDperM = maxWDs / wall.wallsTotalLength;
      // console.log(WDperM);
      let standardSize = maxWD / WDperM;
      // console.log(standardSize);

      wall.standardLength = standardSize;
      wall.wallsNumber = Math.round(wall.wallsTotalLength / standardSize);
    });

    this.wallsPerLevel.forEach((wall) => {
      wall.dbIds.forEach((dbId) => {
        const correspondingWall = this.walls.find((obj) => obj.dbId === dbId);
        if (correspondingWall.length > wall.standardLength) {
          this.wallsToBeSplit.push(correspondingWall.dbId);
        }
      });
    });
    console.log(this.wallsToBeSplit);
    console.log(this.wallsPerLevel);
  }
  public async storeEtappen(): Promise<boolean> {
    const allDbIds = this.getAllDbIds();
    return await this.getBulkProperties(allDbIds, [
      // 'LcIFCProperty:IFCString',
      'Etappe',
    ]).then((res) => {
      const allValues = new Array();
      return asyncForEach(res, (element) => {
        allValues.push(element.properties[0].displayValue);
      }).then(() => {
        const uniqEtap = allValues.filter(
          (item, i, ar) => ar.indexOf(item) === i
        );
        // const concrValues = uniqMat.filter((item) =>
        //   item.includes('hbt_Beton')
        // );
        console.log(uniqEtap);
        uniqEtap.sort();
        const uniqEta = uniqEtap.slice(0, 46);
        console.log(uniqEta);
        return asyncForEach(uniqEta, async (value) => {
          // console.log(value);
          // search is not case sensitive IMP_BETON includes all objects from IMP_BETON_Fertigteil
          await this.search(value, 'LcIFCProperty:IFCString').then(
            (idArray) => {
              // console.log(idArray);
              this.etapObjects.push({
                etappeName: value,
                dbIds: idArray,
                id: this.makeid(5),
              });
            }
          );
        }).then(() => {
          return true;
        });
      });
    });
  }
  public loadEtappenToolbar() {
    // Button Levels
    const button1 = new Autodesk.Viewing.UI.Button('showing-Etappen');
    button1.addClass('showing-Etappen');
    button1.setToolTip('Etappen');
    // @ts-ignore
    button1.container.children[0].classList.add('fas', 'fa-layer-group');

    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
      'my-custom-toolbar-Etappen-controlgroup'
    );
    controlGroup.addControl(button1);
    // Toolbar
    this.toolbarEtappen = new Autodesk.Viewing.UI.ToolBar(
      'my-custom-view-toolbar-etappen',
      { collapsible: false, alignVertically: true }
    );
    button1.onClick = (event) => {
      if (button1.getState() === 1) {
        button1.setState(0);

        this.etapObjects.forEach((object) => {
          if (!object.etappeName) {
            object.etappeName = 'null';
          }
          // Braucht einen Anhang an jede Klasse, da CSS Klasse nicht mit [0-9] beginnen kann
          const annexClass = 'Class_';

          // iterative Button
          const buttonIterativ = new Autodesk.Viewing.UI.Button(
            annexClass + object.id
          );

          // Click Event !! Important !!
          buttonIterativ.onClick = () => {
            if (buttonIterativ.getState() === 1) {
              buttonIterativ.setState(0);
              if (
                this.isolatedNodesEtappen.length === 0 &&
                this.isolatedNodesConcrete.length === 0
              ) {
                this.isolatedNodesEtappen = object.dbIds;
                this.viewerComponent.viewer.isolate(this.isolatedNodesEtappen);
              } else if (
                this.isolatedNodesEtappen.length !== 0 &&
                this.isolatedNodesConcrete.length === 0
              ) {
                this.isolatedNodesEtappen = this.isolatedNodesEtappen.concat(
                  object.dbIds
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesEtappen);
              } else if (
                this.isolatedNodesEtappen.length === 0 &&
                this.isolatedNodesConcrete.length !== 0
              ) {
                this.isolatedNodesEtappen = this.isolatedNodesConcrete.filter(
                  (item) => {
                    return object.dbIds.indexOf(item) !== -1;
                  }
                );
                if (this.isolatedNodesEtappen.length === 0) {
                  return null;
                } else {
                  this.viewerComponent.viewer.isolate(
                    this.isolatedNodesEtappen
                  );
                }
              }
              // this.isolatedNodesEtappen.length !== 0 && this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesEtappen = this.isolatedNodesEtappen.concat(
                  object.dbIds
                );
                this.isolatedNodesEtappen = this.isolatedNodesConcrete.filter(
                  (item) => {
                    return this.isolatedNodesEtappen.indexOf(item) !== -1;
                  }
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesEtappen);
              }
            } else {
              buttonIterativ.setState(1);
              if (this.isolatedNodesConcrete.length === 0) {
                this.isolatedNodesEtappen = this.isolatedNodesEtappen.filter(
                  (item) => {
                    return object.dbIds.indexOf(item) === -1;
                  }
                );
                this.viewerComponent.viewer.isolate(this.isolatedNodesEtappen);
              }
              // this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesEtappen = this.isolatedNodesEtappen.filter(
                  (item) => {
                    return object.dbIds.indexOf(item) === -1;
                  }
                );
                this.isolatedNodesEtappen = this.isolatedNodesConcrete.filter(
                  (item) => {
                    return this.isolatedNodesEtappen.indexOf(item) !== -1;
                  }
                );
                if (this.isolatedNodesEtappen.length === 0) {
                  this.viewerComponent.viewer.isolate(
                    this.isolatedNodesConcrete
                  );
                } else {
                  this.viewerComponent.viewer.isolate(
                    this.isolatedNodesEtappen
                  );
                }
              }
            }
          };

          // test

          buttonIterativ.addClass(annexClass + object.id);
          controlGroup.addControl(buttonIterativ);
          // tslint:disable-next-line: max-line-length
          $('#' + annexClass + object.id).append(
            '<style>.' +
              annexClass +
              object.id +
              ':before{content: attr(data-before); font-size: 20px; color: white;}</style>'
          );
          $('#' + annexClass + object.id).append(
            '<style>.' +
              annexClass +
              object.id +
              '{width: 178px !important}</style>'
          );
          $('#' + annexClass + object.id).append(
            '<style>.' +
              annexClass +
              object.id +
              '{animation: slideMe .7s ease-in;}</style>'
          );
          $('#' + annexClass + object.id.toString()).attr(
            'data-before',
            object.etappeName
          );
        });
      } else {
        button1.setState(1);
        this.isolatedNodesEtappen = new Array();
        while (controlGroup.getNumberOfControls() > 1) {
          const tempID = controlGroup.getControlId(1);
          controlGroup.removeControl(tempID);
        }
      }
    };
    this.toolbarEtappen.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(
      this.toolbarEtappen.container
    );
  }

  public async selectionChanged(event: SelectionChangedEventArgs) {
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;
    this.changePanelValue(dbIdArray);
    this.storeEtappen();
    console.log(this.etapObjects);
    // this.search('', 'Etappe').then((data) => console.log(data));
    // this.storeConcrCategObjects();
    ///////////////////////////// TESTING THREEJS/////////////////////////////////////////
    // this.handleMouseMove(event);
    ///////////////////////////// TESTING /////////////////////////////////////////

    // var meshInfo = this.getComponentGeometry(dbIdArray[0]);

    // console.log(meshInfo);

    // console.log(meshInfo);
    ///////////////////////////// TESTING ///////////////////////////////////////
    // console.log(this.walls);
    // console.log(this.slabs);
    // console.log(this.columns);

    // var root = this.viewerComponent.viewer.model.getInstanceTree().getRootId();
    // console.log(root);
    // console.log('dbid');
    // console.log('----------');
    // console.log(dbIdArray[0]);
    var parent = this.viewerComponent.viewer.model
      .getInstanceTree()
      .getNodeParentId(dbIdArray[0]);
    // console.log('parent');
    // console.log('----------');
    // console.log(parent);
    var parentOfParent = this.viewerComponent.viewer.model
      .getInstanceTree()
      .getNodeParentId(parent);
    // console.log('parentOFparent');
    // console.log('----------');
    // console.log(parentOfParent);
    // var parentOfParentOfParent = this.viewerComponent.viewer.model
    //   .getInstanceTree()
    //   .getNodeParentId(parentOfParent);
    // console.log('parentOFparentOFparent');
    // console.log('----------');
    // console.log(parentOfParentOfParent);
    console.log('dbId DATA');
    console.log('----------');
    this.viewerComponent.viewer.model.getProperties(dbIdArray[0], (data) =>
      console.log(data)
    );
    console.log('parent DATA');
    console.log('----------');
    this.viewerComponent.viewer.model.getProperties(parent, (data) =>
      console.log(data)
    );
    console.log('parentof Parent DATA');
    console.log('----------');
    this.viewerComponent.viewer.model.getProperties(parentOfParent, (data) =>
      console.log(data)
    );
    // console.log('parentDATA');
    // console.log('----------');
    // this.viewerComponent.viewer.model.getProperties(parent, (data) =>
    //   console.log(data)
    // );
    // console.log('ParentOfparentDATA');
    // console.log('----------');
    // this.viewerComponent.viewer.model.getProperties(parentOfParent, (data) =>
    //   console.log(data)
    // );

    // this.workDensityColorMap();
    // this.colorWdObjects(this.walls, 'WDwCR');
    // this.colorWdObjects(this.columns, 'WDcCR');
    // this.colorWdObjects(this.slabs, 'WDsCR');
    // console.log(dbIdArray[0]);
    // console.log(this.isWall(dbIdArray[0]));
    // console.log(this.isColumn(dbIdArray[0]));
    // console.log(this.isSlab(dbIdArray[0]));
  }
}
///////////////////////////////////// NOT USED ///////////////////////////////////////////////////
// public getLeafFragIds(model, leafId) {
//   const instanceTree = model.getData().instanceTree;
//   const fragIds = [];

//   instanceTree.enumNodeFragments(leafId, function (fragId) {
//     fragIds.push(fragId);
//   });

//   return fragIds;
// }

// public getComponentGeometry(dbId) {
//   const viewer = this.viewerComponent.viewer;
//   const fragIds = this.getLeafFragIds(viewer.model, dbId);

//   let matrixWorld = null;

//   const meshes = fragIds.map(function (fragId) {
//     const renderProxy = viewer.impl.getRenderProxy(viewer.model, fragId);

//     const geometry = renderProxy.geometry;
//     const attributes = geometry.attributes;
//     const positions = geometry.vb ? geometry.vb : attributes.position.array;

//     const indices = attributes.index.array || geometry.ib;
//     const stride = geometry.vb ? geometry.vbstride : 3;
//     const offsets = geometry.offsets;

//     matrixWorld = matrixWorld || renderProxy.matrixWorld.elements;

//     return {
//       positions,
//       indices,
//       offsets,
//       stride,
//     };
//   });

//   return {
//     matrixWorld,
//     meshes,
//   };
// }

// let correctLevel = true;
// const id = dbIdArray[0];
// while (correctLevel) {
//   const parentId = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]);
//   this.getProperties(parentId).then(res => {
//     console.log(res);
//     // @ts-ignore
//     if (res.properties.displayName === 'IFCBUILDINGSTOREY') {
//       console.log('IFCBUILDINGSTOREY');
//       correctLevel = false;
//     }
//   });
// }
// var root = this.viewerComponent.viewer.model.getInstanceTree().getRootId();
// console.log(root);
// var parent = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]);
// console.log(parent);
// var parentOfParent = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(parent);
// console.log(parentOfParent);
// var parentOfParentOfParent = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(parentOfParent);
// console.log(parentOfParentOfParent);
// var parentOfParentOfParentOfParent = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(parentOfParentOfParent);
// console.log(parentOfParentOfParentOfParent);
// // console.log(this.slabs);
// this.getProperties(parentOfParentOfParentOfParent).then(res => {
//   console.log(res);
// });
// displayName: "Type"
// displayValue: "IFCBUILDING"
// console.log(parentOfParentOfParentOfParent);

// IFCBUILDINGSTOREY
// console.log(this.walls);
// console.log(this.columns);
// console.log(this.viewerComponent.viewer.getIsolatedNodes());
