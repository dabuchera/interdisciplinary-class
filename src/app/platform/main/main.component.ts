import {
  Component,
  OnInit,
  Input,
  ViewChild,
  Injector,
  ComponentFactoryResolver,
} from '@angular/core';
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

import { AuthToken } from 'forge-apis';
import { ApiService } from 'src/app/_services/api.service';

import { MessageService } from 'primeng/api';

import * as $ from 'jquery';
declare var THREE: any;

import html from './legendTemplate.html';

import htmlgroup2 from './legendTemplate.html';

// Function for async forEach
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

import inputHTML from './inputPanel.html';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit {
  @Input() app: AppComponent;

  public viewerOptions3d: ViewerOptions;
  public encodedmodelurn: string;
  public panel: Autodesk.Viewing.UI.DockingPanel;

  public buttonMain: Autodesk.Viewing.UI.Button;
  public buttonBuildingDesign: Autodesk.Viewing.UI.Button;

  public group: number;

  // Für ng build github
  public message: any;

  // Model stuff
  leafcomponents = [];

  public instanceTree: Autodesk.Viewing.InstanceTree;
  public rootId: number;

  public columnsAboveGround: number[] = new Array();
  public columnsUnderGround: number[] = new Array();
  public slabs: number[] = new Array();
  public floors: number[] = new Array();

  public propertyDatabase: any;

  @ViewChild(ViewerComponent, { static: false })
  viewerComponent: ViewerComponent;

  constructor(
    private api: ApiService,
    private messageService: MessageService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    // this.api.getspecificProject('5faa62b2079c07001454c421').then((res) => {
    //   console.log('getspecificProject');
    //   console.log(res);
    //   this.encodedmodelurn = res.encodedmodelurn;
    // });
    // this.encodedmodelurn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Z3JvdXAxL1Rlc3RGb3JnZS5ydnQ';
    // 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDIxLTAyLTAzLTA4LTUzLTMxLWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlLyVDMyU4OFNCLVNCWl9UTS1BcmJlaXRzdmVyc2lvbi5pZmM=';
    // 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDIxLTAxLTE1LTEzLTA1LTI4LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL2hidF8yMTAxMDVfMTQyOC1TQlowMF9BcmNoaXRla3R1ci5pZmM=';
    this.viewerOptions3d = {
      initializerOptions: {
        env: 'AutodeskProduction',
        getAccessToken: async (onGetAccessToken) => {
          const authToken: AuthToken = await this.api
            .get2LToken()
            .then((res) => {
              console.log(res);
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
        this.viewerComponent.viewer.loadExtension('Autodesk.MemoryLimited');
        // this.viewerComponent.viewer.loadExtension('Autodesk.Viewing.MemoryLimitedDebug');

        // Hide container where model is in
        $('canvas').hide();
        this.replaceSpinner();
        $('.lds-roller').show();
        this.viewerComponent.viewer.setGhosting(false);
        // $('canvas').show();

        this.app.openOverlay();
        this.messageService.add({
          key: 'chooseGroup',
          sticky: true,
          severity: 'warn',
          summary: 'GROUP',
          detail: 'Choose your group',
        });

        // this.choosedGroup1();

        // @ts-ignore
        await Autodesk.Viewing.EventUtils.waitUntilGeometryLoaded(
          this.viewerComponent.viewer
        ).then((res) => {
          console.log('waitUntilGeometryLoaded');
          if (this.group === 2) {
            this.loadFilterToolbar();
          }
          // Instantiation of model stuff
          this.instanceTree =
            this.viewerComponent.viewer.model.getData().instanceTree;

          this.saveFilterStuff();

          $('.lds-roller').hide();
          $('canvas').show();
        });
      },
      // Muss true sein
      showFirstViewable: true,
      // Ist falsch gesetzt => GuiViewer3D => Buttons ausgeblendet in Viewer CSS
      headlessViewer: false,
    };
  }

  ngOnInit(): void {}

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

  closeGroupToast() {
    this.messageService.clear();
    this.app.closeOverlay();
    this.loadVerticalToolbar();
  }

  choosedGroup1() {
    this.group = 1;
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({
      key: 'warning',
      severity: 'success',
      summary: 'Success',
      detail: "You're seeing the model of Group 1",
      life: 5000,
    });

    // model1group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDFncm91cDEucnZ0

    // model2group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDJncm91cDEucnZ0

    // model3group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDNncm91cDEucnZ0

    // model4group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDEucnZ0

    // model5group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDVncm91cDEucnZ0

    // model5group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9ncm91cDEucnZ0

    // model6group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDZncm91cDEucnZ0

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: group1.rvt

    this.viewerComponent.DocumentId =
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDdncm91cDEucnZ0';

    // this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDEucnZ0';
  }

  choosedGroup2() {
    this.group = 2;
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({
      key: 'warning',
      severity: 'success',
      summary: 'Success',
      detail: "You're seeing the model of Group 2",
      life: 5000,
    });

    // model2group2 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDFncm91cDIucnZ0

    // model3group2 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDNncm91cDIucnZ0

    // model4group2 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDIucnZ0

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: model5group2.rvt
    this.viewerComponent.DocumentId =
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDVncm91cDIucnZ0';
  }

  choosedGroup3() {
    this.group = 3;
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({
      key: 'warning',
      severity: 'success',
      summary: 'Success',
      detail: "You're seeing the model of Group 3",
      life: 5000,
    });

    // model1group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDFncm91cDMucnZ0

    // model2group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDJncm91cDMucnZ0

    // model3group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDNncm91cDMucnZ0

    // model4group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDMucnZ0

    // model5group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDVncm91cDMucnZ0

    // testdecal dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS90ZXN0ZGVjYWwucnZ0

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: group3.rvt

    this.viewerComponent.DocumentId =
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9ncm91cDMucnZ0';
  }

  choosedGroup4() {
    this.group = 4;
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({
      key: 'warning',
      severity: 'success',
      summary: 'Success',
      detail: "You're seeing the model of Group 4",
      life: 5000,
    });

    // model1group4 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDIyLTA1LTMwLTE4LTA4LTE5LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL21vZGVsMWdyb3VwNC5ydnQ
    // model2group4 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDIyLTA2LTAyLTA4LTU2LTQ3LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL21vZGVsMmdyb3VwNC5ydnQ


    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: group3.rvt

    this.viewerComponent.DocumentId =
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDIyLTA2LTAyLTA4LTU2LTQ3LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL21vZGVsMmdyb3VwNC5ydnQ';
  }

  public loadVerticalToolbar() {
    // Button 1
    const buttonMain = new Autodesk.Viewing.UI.Button(
      'vertical-toolbar-button'
    );
    buttonMain.addClass('vertical-toolbar-button');
    // @ts-ignore
    buttonMain.container.children[0].classList.add('fas', 'fa-palette');
    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
      'vertical-toolbar-controlGroup'
    );
    controlGroup.addControl(buttonMain);
    // Toolbar
    const toolbarColoring = new Autodesk.Viewing.UI.ToolBar(
      'vertical-toolbar',
      { collapsible: false, alignVertically: true }
    );
    buttonMain.onClick = (event) => {
      if (buttonMain.getState() === 1) {
        $('#vertical-toolbar-button').attr(
          'style',
          'color: #000000 !important ; background-color: #FFFFFF'
        );
        buttonMain.setState(0);
        this.coloringModelNew();
      } else {
        buttonMain.setState(1);
        $('#vertical-toolbar-button').attr(
          'style',
          'color: #FFFFFF !important ; background-color: #000080'
        );
        this.viewerComponent.viewer.clearThemingColors(
          this.viewerComponent.viewer.model
        );
        this.panel.setVisible(false);
      }
    };
    toolbarColoring.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(toolbarColoring.container);
  }

  public loadFilterToolbar() {
    console.log('loadFilterToolbar');

    // @ts-ignore
    var promise = this.viewerComponent.viewer.model.getPropertyDb()
      .executeUserFunction(`function userFunction(pdb) {

      // Momentan vier Parameter
      var returnArr = new Array();
      returnArr[0] = new Array();
      returnArr[1] = new Array();
      returnArr[2] = new Array();
      returnArr[3] = new Array();

      pdb.enumObjects(dbId => {
        if (pdb.getObjectProperties(dbId, ['Building Design'], false)) {
            value = pdb.getObjectProperties(dbId, ['Building Design'], false).properties[0].displayValue;
            var object = {dbId: dbId, attrIdParameter_building_design: value};
            returnArr[0].push(object);
            returnArr[1].push(value);
        }
        if (pdb.getObjectProperties(dbId, ['Building Layer'], false)) {
            value = pdb.getObjectProperties(dbId, ['Building Layer'], false).properties[0].displayValue;
            var object = {dbId: dbId, attrIdParameter_building_layer: value};
            returnArr[2].push(object);
            returnArr[3].push(value);
        }
      });
      return returnArr;
  }`);

    const that = this;
    promise.then((retValue) => {
      console.log(retValue);

      retValue[1] = [...new Set(retValue[1])];
      retValue[3] = [...new Set(retValue[3])];

      // console.log(unique);
      retValue[1].forEach((element) => {
        if (element) {
          console.log(element);
        }
      });
      retValue[3].forEach((element) => {
        if (element) {
          console.log(element);
        }
      });

      // Button Building Design
      const buttonBuildingDesign = new Autodesk.Viewing.UI.Button(
        'filter-toolbar-buttonBuildingDesign'
      );
      buttonBuildingDesign.addClass('filter-toolbar-buttonBuildingDesign');
      buttonBuildingDesign.setIcon('adsk-icon-measure-area-new');
      buttonBuildingDesign.setToolTip('Building Design');
      buttonBuildingDesign.onClick = (event) => {
        this.openPanel(retValue[0], retValue[1], 'Building Design');
      };

      // Button Building Layer
      const buttonBuildingLayer = new Autodesk.Viewing.UI.Button(
        'filter-toolbar-buttonBuildingLayer'
      );
      buttonBuildingLayer.addClass('filter-toolbar-buttonBuildingLayer');
      buttonBuildingLayer.setIcon('adsk-icon-structure');
      buttonBuildingLayer.setToolTip('Building Layer');
      buttonBuildingLayer.onClick = (event) => {
        this.openPanel(retValue[2], retValue[3], 'Building Layer');
      };

      // Control Group
      const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
        'filter-toolbar-controlGroup'
      );
      controlGroup.addControl(buttonBuildingDesign);
      controlGroup.addControl(buttonBuildingLayer);
      // Toolbar
      const toolbarGroup = new Autodesk.Viewing.UI.ToolBar('filter-toolbar', {
        collapsible: false,
        alignVertically: true,
      });
      toolbarGroup.addControl(controlGroup);
      $(this.viewerComponent.viewer.container).append(toolbarGroup.container);
    });
  }

  public openPanel(objectArray, stringArray, filter) {
    console.log('openPanel');

    var container = this.viewerComponent.viewer.container as HTMLElement;
    const panel = new Autodesk.Viewing.UI.DockingPanel(
      container,
      'parameterLegend',
      'Filter: ' + filter,
      { localizeTitle: true, addFooter: true }
    );
    panel.setVisible(true);
    panel.content = document.createElement('div');
    const contentDiv = panel.content as HTMLElement;
    contentDiv.classList.add('container', 'border-box');
    contentDiv.style.boxSizing = 'border-box';
    $(panel.content).append(htmlgroup2);
    contentDiv.style.overflowY = 'scroll';
    contentDiv.style.height = 'calc(100% - 90px)';
    contentDiv.style.color = 'black';
    panel.container.classList.add('docking-panel-container-solid-color-a');
    panel.container.style.height = '700px';
    panel.container.style.width = '250px';
    panel.container.style.minWidth = '250px';
    panel.container.style.resize = 'none';

    panel.container.appendChild(panel.content as HTMLElement);

    stringArray.forEach((element) => {
      const column1row1 = document.createElement('div');
      column1row1.setAttribute('class', 'p-col-12');
      column1row1.innerHTML =
        '<div class="box" style="text-align:center">' + element + '</div>';
      $(panel.container)
        .find('#legend')[0]
        .appendChild(column1row1 as HTMLElement);

      const boxColumn1 = column1row1.children[0];
      // Event Listeners
      boxColumn1.addEventListener(
        'mouseover',
        (event) => {
          const targetElement = event.target as HTMLElement;
          targetElement.style.backgroundColor = '#000080';
          targetElement.style.color = 'white';
        },
        false
      );
      boxColumn1.addEventListener(
        'mouseout',
        (event) => {
          const targetElement = event.target as HTMLElement;
          targetElement.style.backgroundColor = 'transparent';
          targetElement.style.color = 'black';
        },
        false
      );
      boxColumn1.addEventListener('click', async (event) => {
        if (filter === 'Building Design') {
          const newArray = objectArray.filter((el) => {
            return el.attrIdParameter_building_design === element;
          });
          console.log(newArray);
          const isolateArray = new Array();
          newArray.forEach((element) => {
            isolateArray.push(element.dbId);
          });
          console.log(isolateArray);
          this.viewerComponent.viewer.isolate(isolateArray);
        } else {
          const newArray = objectArray.filter((el) => {
            return el.attrIdParameter_building_layer === element;
          });
          console.log(newArray);
          const isolateArray = new Array();
          newArray.forEach((element) => {
            isolateArray.push(element.dbId);
          });
          console.log(isolateArray);
          this.viewerComponent.viewer.isolate(isolateArray);
        }
      });
    });
  }

  public saveFilterStuff() {
    //   // @ts-ignore
    //   var promise = this.viewerComponent.viewer.model.getPropertyDb().executeUserFunction(`function userFunction(pdb) {
    //     // Momentan vier Parameter
    //     var returnArr = new Array();
    //     returnArr[0] = new Array();
    //     returnArr[1] = new Array();
    //     returnArr[2] = new Array();
    //     returnArr[3] = new Array();
    //     var i = 0;
    //     pdb.enumObjects(dbId => {
    //       if (pdb.getObjectProperties(dbId, ['Building Design'], false)) {
    //         value = parseInt(pdb.getObjectProperties(dbId, ['Building Design'], false).properties[0].displayValue);
    //         if (value === 'Facade') {
    //         }
    //         else if () {
    //         }
    //         var object = {dbId: dbId, attrIdParameter_flexibility_rating: value};
    //         returnArr[0].push(object);
    //       }
    //       if (pdb.getObjectProperties(dbId, ['Environmental_Impact'], false)) {
    //         value = parseInt(pdb.getObjectProperties(dbId, ['Environmental_Impact'], false).properties[0].displayValue);
    //         var object = {dbId: dbId, attrIdParameter_environmental_impact: value};
    //         returnArr[1].push(object);
    //       }
    //       if (pdb.getObjectProperties(dbId, ['Circularity'], false)) {
    //         value = parseInt(pdb.getObjectProperties(dbId, ['Circularity'], false).properties[0].displayValue);
    //         var object = {dbId: dbId, attrIdParameter_circularity: value};
    //         returnArr[2].push(object);
    //       }
    //       if (pdb.getObjectProperties(dbId, ['Lifespan'], false)) {
    //         value = parseInt(pdb.getObjectProperties(dbId, ['Lifespan'], false).properties[0].displayValue);
    //         var object = {dbId: dbId, attrIdParameter_lifespan: value};
    //         returnArr[3].push(object);
    //       }
    //     });
    //     return returnArr;
    // }`);
    //   const that = this;
    //   promise.then(function (retValue) {
    //     console.log(retValue);
    //   });
    // this.rootId = this.instanceTree.getRootId();
    // this.instanceTree.enumNodeChildren(this.rootId, callbackId => {
    //   this.viewerComponent.viewer.model.getProperties(callbackId, callback => {
    //     if (callback.name === 'Tragwerksstützen') {
    //       this.instanceTree.enumNodeChildren(callbackId, callbackIdChildren => {
    //         if (this.instanceTree.getChildCount(callbackIdChildren) === 0) {
    //           this.viewerComponent.viewer.model.getProperties(callbackIdChildren, callback => {
    //             console.log(callback.properties[3].displayValue);
    //             const property = callback.properties.find(property => property.displayName === 'Basisebene');
    //             if (property.displayValue === 'UG 1' || property.displayValue === 'UG 2') {
    //               this.columnsUnderGround.push(callbackIdChildren);
    //             }
    //             else {
    //               this.columnsAboveGround.push(callbackIdChildren);
    //             }
    //           });
    //         }
    //       }, true);
    //     }
    //     else if (callback.name === 'Geschossdecken') {
    //       this.instanceTree.enumNodeChildren(callbackId, callbackIdChildren => {
    //         this.slabs.push(callbackIdChildren);
    //       }, true);
    //     }
    //     else if (callback.name === 'Allgemeines Modell') {
    //       this.instanceTree.enumNodeChildren(callbackId, callbackIdChildren => {
    //         this.floors.push(callbackIdChildren);
    //       }, true);
    //     }
    //   });
    // }, false);
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

  public getAllDbIds() {
    const instanceTree =
      this.viewerComponent.viewer.model.getData().instanceTree;
    const allDbIdsStr = Object.keys(instanceTree.nodeAccess.dbIdToIndex);
    // tslint:disable-next-line: radix
    return allDbIdsStr.map((id) => parseInt(id));
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

  // Rot    #ED2938   rgb(237,41,56)
  // Yellow #FFE733   rgb(255,231,51)
  // Orange #FF8C01   rgb(255,140,1)
  // Green  #006B3E   rgb(0,107,62)
  public coloringModel() {
    console.log(this.viewerComponent.viewer.model.getInstanceTree());
    if (this.group === 1) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb()
        .executeUserFunction(`function userFunction(pdb) {

      console.log(pdb.getObjectCount());

      var attrIdParameter_geographical_origin = -1;
      var attrIdParameter_life_cycle_origin = -1;
      var attrIdParameter_flexibility_rating = -1;
      var attrIdParameter_end_of_life_potential = -1;

      // Iterate over all attributes and find the index to the one we are interested in
      pdb.enumAttributes((i, attrDef, attrRaw) => {
        var name = attrDef.name;
        if (name === '1 geographical_origin') {
          attrIdParameter_geographical_origin = i;
          // return true; // to stop iterating over the remaining attributes.
        }
        else if (name === '2 life_cycle_origin') {
          attrIdParameter_life_cycle_origin = i;
        }
        else if (name === '4 flexibility_rating') {
          attrIdParameter_flexibility_rating = i;
        }
        else if (name === '5 end_of_life_potential') {
          attrIdParameter_end_of_life_potential = i;
        }
      });

      // Early return is the model doesn't contain data for "Mass".
      // if (attrIdParameter === -1) {
      //   return null;
      // }

      console.log(attrIdParameter_geographical_origin);
      console.log(attrIdParameter_life_cycle_origin);
      console.log(attrIdParameter_flexibility_rating);
      console.log(attrIdParameter_end_of_life_potential);


      // Momentan vier Parameter
      var returnArr = new Array();
      returnArr[0] = new Array();
      returnArr[1] = new Array();
      returnArr[2] = new Array();
      returnArr[3] = new Array();

      var objectCount = pdb.getObjectCount();

      pdb.enumObjects(dbId => {
        // console.log(dbId);
        // For each part, iterate over their properties.
        pdb.enumObjectProperties(dbId, (attrId, valId) => {

          if (attrId === attrIdParameter_geographical_origin) {
            var value = pdb.getAttrValue(attrId, valId, true);
            var object = {dbId: dbId, attrIdParameter_geographical_origin: value};
            returnArr[0].push(object);
          }
          else if (attrId === attrIdParameter_life_cycle_origin) {
            var value = pdb.getAttrValue(attrId, valId, true);
            var object = {dbId: dbId, attrIdParameter_life_cycle_origin: value};
            returnArr[1].push(object);
          }
          else if (attrId === attrIdParameter_flexibility_rating) {
            var value = pdb.getAttrValue(attrId, valId, true);
            var object = {dbId: dbId, attrIdParameter_flexibility_rating: value};
            returnArr[2].push(object);
          }
          else if (attrId === attrIdParameter_end_of_life_potential) {
            var value = pdb.getAttrValue(attrId, valId, true);
            var object = {dbId: dbId, attrIdParameter_end_of_life_potential: value};
            returnArr[3].push(object);
          }
        });
      });
      return returnArr;
  }`);

      const that = this;
      promise.then((retValue) => {
        console.log(retValue);

        const color = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);

        const dbIdToIndex =
          this.viewerComponent.viewer.model.getInstanceTree().nodeAccess
            .dbIdToIndex;
        for (let index = 0; index < retValue[0].length; index++) {
          console.log(retValue[0][index]);
          this.viewerComponent.viewer.setThemingColor(
            parseInt(
              Object.keys(dbIdToIndex).find(
                (key) => dbIdToIndex[key] === retValue[0][index].dbId
              )
            ),
            color,
            that.viewerComponent.viewer.model,
            true
          );
        }
        console.log(retValue);
        console.log(
          this.viewerComponent.viewer.model.getInstanceTree().nodeAccess
        );
        console.log(
          this.viewerComponent.viewer.model.getInstanceTree().nodeAccess
            .dbIdToIndex[30]
        );

        var container = that.viewerComponent.viewer.container as HTMLElement;
        that.panel = new Autodesk.Viewing.UI.DockingPanel(
          container,
          'parameterLegend',
          'Parameter Legend: Group ' + that.group,
          { localizeTitle: true, addFooter: true }
        );
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add(
          'docking-panel-container-solid-color-a'
        );
        that.panel.container.style.height = '350px';
        that.panel.container.style.width = '650px';
        that.panel.container.style.minWidth = '650px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container)
          .find('.docking-panel-close')
          .click((e) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            that.buttonMain.setState(1);
            $('#vertical-toolbar-button').attr(
              'style',
              'color: #FFFFFF !important ; background-color: #000080'
            );
            return false;
          });

        // Rot    #ED2938       rgb(237,41,56)
        // Yellow #FFE733       rgb(255,231,51)
        // Orange #FF8C01       rgb(255,140,1)
        // Green  #006B3E       rgb(0,107,62)
        // Light Green #39d688  rgb(57,214,136)

        const colorRed = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorYellow = new THREE.Vector4(
          255 / 256,
          231 / 256,
          51 / 256,
          1
        );
        const colorOrange = new THREE.Vector4(255 / 256, 140 / 256, 1 / 256, 1);
        const colorGreen = new THREE.Vector4(0 / 256, 107 / 256, 62 / 256, 1);
        const colorLightGreen = new THREE.Vector4(
          57 / 256,
          214 / 256,
          136 / 256,
          1
        );

        ////////////////////////  Geographical Origin  ////////////////////////
        {
          const column1row1 = document.createElement('div');
          column1row1.setAttribute('class', 'p-col-3');
          column1row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Geographical Origin' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn1.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn1.addEventListener('click', async (event) => {
            retValue[0].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_geographical_origin === 0) {
                color = colorGreen;
              } else if (obj.attrIdParameter_geographical_origin === 1) {
                color = colorYellow;
              } else if (obj.attrIdParameter_geographical_origin === 2) {
                color = colorRed;
              }
              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-3');
          column1row2.innerHTML =
            '<div class="box" style="background-color:#006B3E;text-align:center">' +
            '0' +
            '</div>';
          column1row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-3');
          column1row3.innerHTML =
            '<div class="box" style="background-color:#FFE733;text-align:center">' +
            '1' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-3');
          column1row4.innerHTML =
            '<div class="box" style="background-color:#ED2938;text-align:center">' +
            '2' +
            '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row4 as HTMLElement);
        }
        ////////////////////////  Life Cycle Origin  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Life Cycle Origin' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxColumn2 = column2row1.children[0];
          // Event Listeners
          boxColumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn2.addEventListener('click', async (event) => {
            retValue[1].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_life_cycle_origin === 0) {
                color = colorGreen;
              } else if (obj.attrIdParameter_life_cycle_origin === 1) {
                color = colorYellow;
              } else if (obj.attrIdParameter_life_cycle_origin === 2) {
                color = colorOrange;
              }
              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-3');
          column2row2.innerHTML =
            '<div class="box" style="background-color:#006B3E;text-align:center">' +
            '0' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-3');
          column2row3.innerHTML =
            '<div class="box" style="background-color:#FFE733;text-align:center">' +
            '1' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-3');
          column2row4.innerHTML =
            '<div class="box" style="background-color:#FF8C01;text-align:center">' +
            '2' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          // Rot    #ED2938   rgb(237,41,56)
          // Yellow #FFE733   rgb(255,231,51)
          // Orange #FF8C01   rgb(255,140,1)
          // Green  #006B3E   rgb(0,107,62)
        }
        ////////////////////////  Flexibility Rating  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Flexibility Rating' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row1 as HTMLElement);

          const boxColumn3 = column3row1.children[0];
          // Event Listeners
          boxColumn3.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn3.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn3.addEventListener('click', async (event) => {
            retValue[2].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_flexibility_rating === 0) {
                color = colorGreen;
              } else if (obj.attrIdParameter_flexibility_rating === 1) {
                color = colorYellow;
              } else if (obj.attrIdParameter_flexibility_rating === 2) {
                color = colorRed;
              }
              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-3');
          column3row2.innerHTML =
            '<div class="box" style="background-color:#006B3E;text-align:center">' +
            '0' +
            '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-3');
          column3row3.innerHTML =
            '<div class="box" style="background-color:#FFE733;text-align:center">' +
            '1' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-3');
          column3row4.innerHTML =
            '<div class="box" style="background-color:#ED2938;text-align:center">' +
            '2' +
            '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row4 as HTMLElement);

          // Rot    #ED2938       rgb(237,41,56)
          // Yellow #FFE733       rgb(255,231,51)
          // Orange #FF8C01       rgb(255,140,1)
          // Green  #006B3E       rgb(0,107,62)
          // Light Green #39d688  rgb(57,214,136)
        }
        ////////////////////////  End of Life Potential  ////////////////////////
        {
          const column4row1 = document.createElement('div');
          column4row1.setAttribute('class', 'p-col-3');
          column4row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'End of Life Potential' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row1 as HTMLElement);

          const box = column4row1.children[0];
          // Event Listeners
          box.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          box.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          box.addEventListener('click', async (event) => {
            retValue[3].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_end_of_life_potential === 0) {
                color = colorGreen;
              } else if (obj.attrIdParameter_end_of_life_potential === 1) {
                color = colorLightGreen;
              } else if (obj.attrIdParameter_end_of_life_potential === 2) {
                color = colorYellow;
              } else if (obj.attrIdParameter_end_of_life_potential === 3) {
                color = colorOrange;
              } else if (obj.attrIdParameter_end_of_life_potential === 4) {
                color = colorRed;
              }
              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column4row2 = document.createElement('div');
          column4row2.setAttribute('class', 'p-col-1');
          column4row2.innerHTML =
            '<div class="box" style="background-color:#006B3E;text-align:center">' +
            '0' +
            '</div>';
          column4row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row2 as HTMLElement);

          const column4row3 = document.createElement('div');
          column4row3.setAttribute('class', 'p-col-2');
          column4row3.innerHTML =
            '<div class="box" style="background-color:#39d688;text-align:center">' +
            '1' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row3 as HTMLElement);

          const column4row4 = document.createElement('div');
          column4row4.setAttribute('class', 'p-col-2');
          column4row4.innerHTML =
            '<div class="box" style="background-color:#FFE733;text-align:center">' +
            '2' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row4 as HTMLElement);

          const column5row4 = document.createElement('div');
          column5row4.setAttribute('class', 'p-col-2');
          column5row4.innerHTML =
            '<div class="box" style="background-color:#FF8C01;text-align:center">' +
            '3' +
            '</div>';
          column5row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column5row4 as HTMLElement);

          const column6row4 = document.createElement('div');
          column6row4.setAttribute('class', 'p-col-2');
          column6row4.innerHTML =
            '<div class="box" style="background-color:#ED2938;text-align:center">' +
            '4' +
            '</div>';
          column6row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column6row4 as HTMLElement);
        }
      });
    } else if (this.group === 2) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb()
        .executeUserFunction(`function userFunction(pdb) {
      var attrIdParameter = -1;
      // Iterate over all attributes and find the index to the one we are interested in
      pdb.enumAttributes((i, attrDef, attrRaw) => {
        const name = attrDef.name;
        if (name === 'Flexibility_Rating') {
          attrIdParameter = i;
          return true; // to stop iterating over the remaining attributes.
        }
      });

      // Early return is the model doesn't contain data for "Mass".
      if (attrIdParameter === -1) {
          return null;
      }

      // Now iterate over all parts to find out which one is the largest.
      var maxValue = 0;
      var maxValId = -1;

      var returnArr = new Array();
      returnArr[0] = new Array();
      returnArr[1] = new Array();
      returnArr[2] = new Array();
      returnArr[3] = new Array();

      pdb.enumObjects(dbId => {

      // For each part, iterate over their properties.
      pdb.enumObjectProperties(dbId, (attrId, valId) => {
          
      if (attrId === attrIdParameter) {
        var value = pdb.getAttrValue(attrId, valId, true);
        if (value === 0) {
          returnArr[0].push(dbId);
        }
        else if (value === 1) {
          returnArr[1].push(dbId);
        }
        else if (value === 2) {
          returnArr[2].push(dbId);
        }
        else if (value === 3) {
          returnArr[3].push(dbId);
        }
        return true;
      }
    });
    });
        return returnArr;
      }`);
      const that = this;
      promise.then(function (retValue) {
        if (!retValue) {
          this.messageService.add({
            key: 'warning',
            sticky: true,
            severity: 'error',
            summary: 'Coloring',
            detail: "Model doesn't contain property 'Flexibility_Rating'.",
          });
          return;
        }

        console.log(retValue);

        const colorRed = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorOrange = new THREE.Vector4(255 / 256, 140 / 256, 1 / 256, 1);
        const colorYellow = new THREE.Vector4(
          255 / 256,
          231 / 256,
          51 / 256,
          1
        );
        const colorGreen = new THREE.Vector4(0 / 256, 132 / 256, 80 / 256, 1);

        const instanceTree = that.instanceTree;
        const rootNodeId = instanceTree.getRootId();
        that.viewerComponent.viewer.setThemingColor(
          rootNodeId,
          colorRed,
          that.viewerComponent.viewer.model,
          true
        );

        // const traverseRecursively = true;
        // function callback(dbid) {
        //   console.log('Found object ID', dbid);
        // }
        // instanceTree.enumNodeChildren(rootNodeId, callback, traverseRecursively);

        retValue[0].forEach((dbid) => {
          if (
            !that.viewerComponent.viewer.model
              .getInstanceTree()
              .getNodeParentId(dbid)
          ) {
            that.viewerComponent.viewer.setThemingColor(
              dbid + 2,
              colorRed,
              that.viewerComponent.viewer.model,
              true
            );
          } else {
            that.viewerComponent.viewer.setThemingColor(
              dbid,
              colorRed,
              that.viewerComponent.viewer.model,
              true
            );
          }
        });
        retValue[1].forEach((dbid) => {
          if (
            !that.viewerComponent.viewer.model
              .getInstanceTree()
              .getNodeParentId(dbid)
          ) {
            that.viewerComponent.viewer.setThemingColor(
              dbid + 2,
              colorOrange,
              that.viewerComponent.viewer.model,
              true
            );
          } else {
            that.viewerComponent.viewer.setThemingColor(
              dbid,
              colorOrange,
              that.viewerComponent.viewer.model,
              true
            );
          }
        });
        retValue[2].forEach((dbid) => {
          if (
            !that.viewerComponent.viewer.model
              .getInstanceTree()
              .getNodeParentId(dbid)
          ) {
            that.viewerComponent.viewer.setThemingColor(
              dbid + 2,
              colorYellow,
              that.viewerComponent.viewer.model,
              true
            );
          } else {
            that.viewerComponent.viewer.setThemingColor(
              dbid,
              colorYellow,
              that.viewerComponent.viewer.model,
              true
            );
          }
        });
        retValue[3].forEach((dbid) => {
          if (
            !that.viewerComponent.viewer.model
              .getInstanceTree()
              .getNodeParentId(dbid)
          ) {
            that.viewerComponent.viewer.setThemingColor(
              dbid + 2,
              colorGreen,
              that.viewerComponent.viewer.model,
              true
            );
          } else {
            that.viewerComponent.viewer.setThemingColor(
              dbid,
              colorGreen,
              that.viewerComponent.viewer.model,
              true
            );
          }
        });
        // var mostMassiveId = retValue.id;
        // that.viewerComponent.viewer.select(mostMassiveId);
        // that.viewerComponent.viewer.fitToView([mostMassiveId]);
        // console.log('Most massive part is', mostMassiveId, 'with Mass:', retValue.mass);
      });
    } else if (this.group === 3) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb()
        .executeUserFunction(`function userFunction(pdb) {

      console.log(pdb);

      console.log(pdb.getObjectCount());

      var attrIdParameter_flexibility_rating = -1;
      var attrIdParameter_environmental_impact = -1;
      var attrIdParameter_circularity = -1;
      var attrIdParameter_lifespan = -1;

      // console.log(pdb.bruteForceFind('Flexibility_Rating'));

      // Iterate over all attributes and find the index to the one we are interested in
      pdb.enumAttributes((i, attrDef, attrRaw) => {
        var name = attrDef.name;
        if (name === 'Flexibility_Rating') {
          attrIdParameter_flexibility_rating = i;
        }
        else if (name === 'Environmental_Impact') {
          attrIdParameter_environmental_impact = i;
        }
        else if (name === 'Circularity') {
          attrIdParameter_circularity = i;
        }
        else if (name === 'Lifespan') {
          attrIdParameter_lifespan = i;
        }
      });

      // Early return is the model doesn't contain data for "Mass".
      // if (attrIdParameter === -1) {
      //   return null;
      // }
      
      console.log(attrIdParameter_flexibility_rating);
      console.log(attrIdParameter_environmental_impact);
      console.log(attrIdParameter_circularity);
      console.log(attrIdParameter_lifespan);


      // Momentan vier Parameter
      var returnArr = new Array();
      returnArr[0] = new Array();
      returnArr[1] = new Array();
      returnArr[2] = new Array();
      returnArr[3] = new Array();

      var i = 0;

      pdb.enumObjects(dbId => {

        if(pdb.getObjectProperties(dbId, ['Flexibility_Rating'], false)){
          i+=1;
        }    
        // For each part, iterate over their properties.
        pdb.enumObjectProperties(dbId, (attrId, valId) => {
          if (attrId === attrIdParameter_flexibility_rating) {
            var value = pdb.getAttrValue(attrId, valId, true);
            var object = {dbId: dbId, attrIdParameter_flexibility_rating: value};
            returnArr[0].push(object);
          }
          else if (attrId === attrIdParameter_environmental_impact) {
            var value = pdb.getAttrValue(attrId, valId, true);
            var object = {dbId: dbId, attrIdParameter_environmental_impact: value};
            returnArr[1].push(object);
          }
          else if (attrId === attrIdParameter_circularity) {
            var value = pdb.getAttrValue(attrId, valId, true);
            var object = {dbId: dbId, attrIdParameter_circularity: value};
            returnArr[2].push(object);
          }
          else if (attrId === attrIdParameter_lifespan) {
            var value = pdb.getAttrValue(attrId, valId, true);
            var object = {dbId: dbId, attrIdParameter_lifespan: value};
            returnArr[3].push(object);
          }
        });
      });
      return returnArr;
  }`);

      const that = this;
      promise.then(function (retValue) {
        console.log(retValue);

        var container = that.viewerComponent.viewer.container as HTMLElement;
        that.panel = new Autodesk.Viewing.UI.DockingPanel(
          container,
          'parameterLegend',
          'Parameter Legend: Group ' + that.group,
          { localizeTitle: true, addFooter: true }
        );
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add(
          'docking-panel-container-solid-color-a'
        );
        that.panel.container.style.height = '350px';
        that.panel.container.style.width = '650px';
        that.panel.container.style.minWidth = '650px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container)
          .find('.docking-panel-close')
          .click((e) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            that.buttonMain.setState(1);
            $('#vertical-toolbar-button').attr(
              'style',
              'color: #FFFFFF !important ; background-color: #000080'
            );
            return false;
          });

        // Rot    #ED2938       rgb(237,41,56)
        // Yellow #FFE733       rgb(255,231,51)
        // Orange #FF8C01       rgb(255,140,1)
        // Green  #006B3E       rgb(0,107,62)
        // Light Green #39d688  rgb(57,214,136)

        const colorRed1 = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorRed2 = new THREE.Vector4(213 / 256, 70 / 256, 20 / 256, 1);
        const colorRed3 = new THREE.Vector4(185 / 256, 88 / 256, 0 / 256, 1);
        const colorRed4 = new THREE.Vector4(155 / 256, 100 / 256, 0 / 256, 1);
        const colorYellow = new THREE.Vector4(126 / 256, 107 / 256, 0 / 256, 1);
        const colorGreen4 = new THREE.Vector4(98 / 256, 110 / 256, 0 / 256, 1);
        const colorGreen3 = new THREE.Vector4(71 / 256, 111 / 256, 17 / 256, 1);
        const colorGreen2 = new THREE.Vector4(43 / 256, 110 / 256, 42 / 256, 1);
        const colorGreen1 = new THREE.Vector4(0 / 256, 107 / 256, 62 / 256, 1);

        ////////////////////////  Flexibility Rating  ////////////////////////
        {
          const column1row1 = document.createElement('div');
          column1row1.setAttribute('class', 'p-col-3');
          column1row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Flexibility Rating' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn1.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn1.addEventListener('click', async (event) => {
            retValue[0].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_flexibility_rating === 0) {
                color = colorRed1;
              } else if (obj.attrIdParameter_flexibility_rating === 1) {
                color = colorRed2;
              } else if (obj.attrIdParameter_flexibility_rating === 2) {
                color = colorRed3;
              }
              if (obj.attrIdParameter_flexibility_rating === 3) {
                color = colorRed4;
              } else if (obj.attrIdParameter_flexibility_rating === 4) {
                color = colorYellow;
              } else if (obj.attrIdParameter_flexibility_rating === 5) {
                color = colorGreen4;
              }
              if (obj.attrIdParameter_flexibility_rating === 6) {
                color = colorGreen3;
              } else if (obj.attrIdParameter_flexibility_rating === 7) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_flexibility_rating === 8) {
                color = colorGreen1;
              }
              // console.log('parent');
              // console.log(this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]));

              // console.log('child');
              // console.log(this.viewerComponent.viewer.model.getInstanceTree().getChildCount(dbIdArray[0]));
              that.viewerComponent.viewer.setThemingColor(
                obj.dbId + 4,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-1');
          column1row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '0' +
            '</div>';
          column1row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-1');
          column1row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '1' +
            '</div>';
          column1row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-1');
          column1row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '2' +
            '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row4 as HTMLElement);

          const column1row5 = document.createElement('div');
          column1row5.setAttribute('class', 'p-col-1');
          column1row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '3' +
            '</div>';
          column1row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row5 as HTMLElement);

          const column1row6 = document.createElement('div');
          column1row6.setAttribute('class', 'p-col-1');
          column1row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '4' +
            '</div>';
          column1row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row6 as HTMLElement);

          const column1row7 = document.createElement('div');
          column1row7.setAttribute('class', 'p-col-1');
          column1row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '5' +
            '</div>';
          column1row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row7 as HTMLElement);

          const column1row8 = document.createElement('div');
          column1row8.setAttribute('class', 'p-col-1');
          column1row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '6' +
            '</div>';
          column1row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row8 as HTMLElement);

          const column1row9 = document.createElement('div');
          column1row9.setAttribute('class', 'p-col-1');
          column1row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '7' +
            '</div>';
          column1row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row9 as HTMLElement);

          const column1row10 = document.createElement('div');
          column1row10.setAttribute('class', 'p-col-1');
          column1row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '8' +
            '</div>';
          column1row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row10 as HTMLElement);
        }
        ////////////////////////  Environmental Impact  ////////////////////////
        // {
        //   const column2row1 = document.createElement('div');
        //   column2row1.setAttribute('class', 'p-col-3');
        //   column2row1.innerHTML = '<div class="box" style="text-align:center">' + 'Life Cycle Origin' + '</div>';
        //   $(that.panel.container).find('#legend')[0].appendChild(column2row1 as HTMLElement);

        //   const boxColumn2 = column2row1.children[0];
        //   // Event Listeners
        //   boxColumn2.addEventListener('mouseover', (event) => {
        //     const targetElement = event.target as HTMLElement;
        //     targetElement.style.backgroundColor = '#000080';
        //     targetElement.style.color = 'white';
        //   }, false);
        //   boxColumn2.addEventListener('mouseout', (event) => {
        //     const targetElement = event.target as HTMLElement;
        //     targetElement.style.backgroundColor = 'transparent';
        //     targetElement.style.color = 'black';
        //   }, false);
        //   boxColumn2.addEventListener('click', async (event) => {
        //     retValue[1].forEach(obj => {
        //       let color;
        //       if (obj.attrIdParameter_life_cycle_origin === 0) {
        //         color = colorGreen;
        //       }
        //       else if (obj.attrIdParameter_life_cycle_origin === 1) {
        //         color = colorYellow;
        //       }
        //       else if (obj.attrIdParameter_life_cycle_origin === 2) {
        //         color = colorOrange;
        //       }
        //       that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
        //     });
        //   });

        //   const column2row2 = document.createElement('div');
        //   column2row2.setAttribute('class', 'p-col-3');
        //   column2row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
        //   column2row2.style.color = 'white';
        //   $(that.panel.container).find('#legend')[0].appendChild(column2row2 as HTMLElement);

        //   const column2row3 = document.createElement('div');
        //   column2row3.setAttribute('class', 'p-col-3');
        //   column2row3.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '1' + '</div>';
        //   $(that.panel.container).find('#legend')[0].appendChild(column2row3 as HTMLElement);

        //   const column2row4 = document.createElement('div');
        //   column2row4.setAttribute('class', 'p-col-3');
        //   column2row4.innerHTML = '<div class="box" style="background-color:#FF8C01;text-align:center">' + '2' + '</div>';
        //   column2row4.style.color = 'white';
        //   $(that.panel.container).find('#legend')[0].appendChild(column2row4 as HTMLElement);

        //   // Rot    #ED2938   rgb(237,41,56)
        //   // Yellow #FFE733   rgb(255,231,51)
        //   // Orange #FF8C01   rgb(255,140,1)
        //   // Green  #006B3E   rgb(0,107,62)
        // }
        ////////////////////////  Flexibility Rating  ////////////////////////
        //   {
        //     const column3row1 = document.createElement('div');
        //     column3row1.setAttribute('class', 'p-col-3');
        //     column3row1.innerHTML = '<div class="box" style="text-align:center">' + 'Flexibility Rating' + '</div>';
        //     $(that.panel.container).find('#legend')[0].appendChild(column3row1 as HTMLElement);

        //     const boxColumn3 = column3row1.children[0];
        //     // Event Listeners
        //     boxColumn3.addEventListener('mouseover', (event) => {
        //       const targetElement = event.target as HTMLElement;
        //       targetElement.style.backgroundColor = '#000080';
        //       targetElement.style.color = 'white';
        //     }, false);
        //     boxColumn3.addEventListener('mouseout', (event) => {
        //       const targetElement = event.target as HTMLElement;
        //       targetElement.style.backgroundColor = 'transparent';
        //       targetElement.style.color = 'black';
        //     }, false);
        //     boxColumn3.addEventListener('click', async (event) => {
        //       retValue[2].forEach(obj => {
        //         let color;
        //         if (obj.attrIdParameter_flexibility_rating === 0) {
        //           color = colorGreen;
        //         }
        //         else if (obj.attrIdParameter_flexibility_rating === 1) {
        //           color = colorYellow;
        //         }
        //         else if (obj.attrIdParameter_flexibility_rating === 2) {
        //           color = colorRed;
        //         }
        //         that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
        //       });
        //     });

        //     const column3row2 = document.createElement('div');
        //     column3row2.setAttribute('class', 'p-col-3');
        //     column3row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
        //     column3row2.style.color = 'white';
        //     $(that.panel.container).find('#legend')[0].appendChild(column3row2 as HTMLElement);

        //     const column3row3 = document.createElement('div');
        //     column3row3.setAttribute('class', 'p-col-3');
        //     column3row3.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '1' + '</div>';
        //     $(that.panel.container).find('#legend')[0].appendChild(column3row3 as HTMLElement);

        //     const column3row4 = document.createElement('div');
        //     column3row4.setAttribute('class', 'p-col-3');
        //     column3row4.innerHTML = '<div class="box" style="background-color:#ED2938;text-align:center">' + '2' + '</div>';
        //     column3row4.style.color = 'white';
        //     $(that.panel.container).find('#legend')[0].appendChild(column3row4 as HTMLElement);

        //     // Rot    #ED2938       rgb(237,41,56)
        //     // Yellow #FFE733       rgb(255,231,51)
        //     // Orange #FF8C01       rgb(255,140,1)
        //     // Green  #006B3E       rgb(0,107,62)
        //     // Light Green #39d688  rgb(57,214,136)
        //   }
        //   ////////////////////////  End of Life Potential  ////////////////////////
        //   {
        //     const column4row1 = document.createElement('div');
        //     column4row1.setAttribute('class', 'p-col-3');
        //     column4row1.innerHTML = '<div class="box" style="text-align:center">' + 'End of Life Potential' + '</div>';
        //     $(that.panel.container).find('#legend')[0].appendChild(column4row1 as HTMLElement);

        //     const box = column4row1.children[0];
        //     // Event Listeners
        //     box.addEventListener('mouseover', (event) => {
        //       const targetElement = event.target as HTMLElement;
        //       targetElement.style.backgroundColor = '#000080';
        //       targetElement.style.color = 'white';
        //     }, false);
        //     box.addEventListener('mouseout', (event) => {
        //       const targetElement = event.target as HTMLElement;
        //       targetElement.style.backgroundColor = 'transparent';
        //       targetElement.style.color = 'black';
        //     }, false);
        //     box.addEventListener('click', async (event) => {
        //       retValue[3].forEach(obj => {
        //         let color;
        //         if (obj.attrIdParameter_end_of_life_potential === 0) {
        //           color = colorGreen;
        //         }
        //         else if (obj.attrIdParameter_end_of_life_potential === 1) {
        //           color = colorLightGreen;
        //         }
        //         else if (obj.attrIdParameter_end_of_life_potential === 2) {
        //           color = colorYellow;
        //         }
        //         else if (obj.attrIdParameter_end_of_life_potential === 3) {
        //           color = colorOrange;
        //         }
        //         else if (obj.attrIdParameter_end_of_life_potential === 4) {
        //           color = colorRed;
        //         }
        //         that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
        //       });
        //     });

        //     const column4row2 = document.createElement('div');
        //     column4row2.setAttribute('class', 'p-col-1');
        //     column4row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
        //     column4row2.style.color = 'white';
        //     $(that.panel.container).find('#legend')[0].appendChild(column4row2 as HTMLElement);

        //     const column4row3 = document.createElement('div');
        //     column4row3.setAttribute('class', 'p-col-2');
        //     column4row3.innerHTML = '<div class="box" style="background-color:#39d688;text-align:center">' + '1' + '</div>';
        //     $(that.panel.container).find('#legend')[0].appendChild(column4row3 as HTMLElement);

        //     const column4row4 = document.createElement('div');
        //     column4row4.setAttribute('class', 'p-col-2');
        //     column4row4.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '2' + '</div>';
        //     $(that.panel.container).find('#legend')[0].appendChild(column4row4 as HTMLElement);

        //     const column5row4 = document.createElement('div');
        //     column5row4.setAttribute('class', 'p-col-2');
        //     column5row4.innerHTML = '<div class="box" style="background-color:#FF8C01;text-align:center">' + '3' + '</div>';
        //     column5row4.style.color = 'white';
        //     $(that.panel.container).find('#legend')[0].appendChild(column5row4 as HTMLElement);

        //     const column6row4 = document.createElement('div');
        //     column6row4.setAttribute('class', 'p-col-2');
        //     column6row4.innerHTML = '<div class="box" style="background-color:#ED2938;text-align:center">' + '4' + '</div>';
        //     column6row4.style.color = 'white';
        //     $(that.panel.container).find('#legend')[0].appendChild(column6row4 as HTMLElement);
        //   }
      });
    }
  }

  public coloringModelNew() {
    if (this.group === 1) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb()
        .executeUserFunction(`function userFunction(pdb) {

        // Momentan vier Parameter
        var returnArr = new Array();
        returnArr[0] = new Array();
        returnArr[1] = new Array();
        returnArr[2] = new Array();
        returnArr[3] = new Array();

        pdb.enumObjects(dbId => {
          if (pdb.getObjectProperties(dbId, ['1 geographical_origin'], false)) {
            value = parseInt(pdb.getObjectProperties(dbId, ['1 geographical_origin'], false).properties[0].displayValue);
            var object = {dbId: dbId, attrIdParameter_geographical_origin: value};
            returnArr[0].push(object);
          }
          if (pdb.getObjectProperties(dbId, ['2 life_cycle_origin'], false)) {
            value = parseInt(pdb.getObjectProperties(dbId, ['2 life_cycle_origin'], false).properties[0].displayValue);
            var object = {dbId: dbId, attrIdParameter_life_cycle_origin: value};
            returnArr[1].push(object);
          }
          if (pdb.getObjectProperties(dbId, ['4 flexibility_rating'], false)) {
            value = parseInt(pdb.getObjectProperties(dbId, ['4 flexibility_rating'], false).properties[0].displayValue);
            var object = {dbId: dbId, attrIdParameter_flexibility_rating: value};
            returnArr[2].push(object);
          }
          if (pdb.getObjectProperties(dbId, ['5 end_of_life_potential'], false)) {
            value = parseInt(pdb.getObjectProperties(dbId, ['5 end_of_life_potential'], false).properties[0].displayValue);
            var object = {dbId: dbId, attrIdParameter_end_of_life_potential: value};
            returnArr[3].push(object);
          }
        });
        return returnArr;
      }`);

      const that = this;
      promise.then((retValue) => {
        console.log(retValue);

        var container = that.viewerComponent.viewer.container as HTMLElement;
        that.panel = new Autodesk.Viewing.UI.DockingPanel(
          container,
          'parameterLegend',
          'Parameter Legend: Group ' + that.group,
          { localizeTitle: true, addFooter: true }
        );
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add(
          'docking-panel-container-solid-color-a'
        );
        that.panel.container.style.height = '350px';
        that.panel.container.style.width = '650px';
        that.panel.container.style.minWidth = '650px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container)
          .find('.docking-panel-close')
          .click((e) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            that.buttonMain.setState(1);
            $('#vertical-toolbar-button').attr(
              'style',
              'color: #FFFFFF !important ; background-color: #000080'
            );
            return false;
          });

        // Rot    #ED2938       rgb(237,41,56)
        // Yellow #FFE733       rgb(255,231,51)
        // Orange #FF8C01       rgb(255,140,1)
        // Green  #006B3E       rgb(0,107,62)
        // Light Green #39d688  rgb(57,214,136)

        const colorRed = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorYellow = new THREE.Vector4(
          255 / 256,
          231 / 256,
          51 / 256,
          1
        );
        const colorOrange = new THREE.Vector4(255 / 256, 140 / 256, 1 / 256, 1);
        const colorGreen = new THREE.Vector4(0 / 256, 107 / 256, 62 / 256, 1);
        const colorLightGreen = new THREE.Vector4(
          57 / 256,
          214 / 256,
          136 / 256,
          1
        );

        ////////////////////////  Geographical Origin  ////////////////////////
        {
          const column1row1 = document.createElement('div');
          column1row1.setAttribute('class', 'p-col-3');
          column1row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Geographical Origin' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn1.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn1.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[0].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_geographical_origin === 0) {
                color = colorGreen;
              } else if (obj.attrIdParameter_geographical_origin === 1) {
                color = colorYellow;
              } else if (obj.attrIdParameter_geographical_origin === 2) {
                color = colorRed;
              }

              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-3');
          column1row2.innerHTML =
            '<div class="box" style="background-color:#006B3E;text-align:center">' +
            '0' +
            '</div>';
          column1row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-3');
          column1row3.innerHTML =
            '<div class="box" style="background-color:#FFE733;text-align:center">' +
            '1' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-3');
          column1row4.innerHTML =
            '<div class="box" style="background-color:#ED2938;text-align:center">' +
            '2' +
            '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row4 as HTMLElement);

          // Rot    #ED2938   rgb(237,41,56)
          // Yellow #FFE733   rgb(255,231,51)
          // Orange #FF8C01   rgb(255,140,1)
          // Green  #006B3E   rgb(0,107,62)
        }
        ////////////////////////  Life Cycle Origin  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Life Cycle Origin' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxColumn2 = column2row1.children[0];
          // Event Listeners
          boxColumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[1].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_life_cycle_origin === 0) {
                color = colorGreen;
              } else if (obj.attrIdParameter_life_cycle_origin === 1) {
                color = colorYellow;
              } else if (obj.attrIdParameter_life_cycle_origin === 2) {
                color = colorOrange;
              }

              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-3');
          column2row2.innerHTML =
            '<div class="box" style="background-color:#006B3E;text-align:center">' +
            '0' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-3');
          column2row3.innerHTML =
            '<div class="box" style="background-color:#FFE733;text-align:center">' +
            '1' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-3');
          column2row4.innerHTML =
            '<div class="box" style="background-color:#FF8C01;text-align:center">' +
            '2' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          // Rot    #ED2938   rgb(237,41,56)
          // Yellow #FFE733   rgb(255,231,51)
          // Orange #FF8C01   rgb(255,140,1)
          // Green  #006B3E   rgb(0,107,62)
        }
        ////////////////////////  Flexibility Rating  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Flexibility Rating' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row1 as HTMLElement);

          const boxColumn3 = column3row1.children[0];
          // Event Listeners
          boxColumn3.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn3.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn3.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[2].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_flexibility_rating === 0) {
                color = colorGreen;
              } else if (obj.attrIdParameter_flexibility_rating === 1) {
                color = colorYellow;
              } else if (obj.attrIdParameter_flexibility_rating === 2) {
                color = colorRed;
              }

              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-3');
          column3row2.innerHTML =
            '<div class="box" style="background-color:#006B3E;text-align:center">' +
            '0' +
            '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-3');
          column3row3.innerHTML =
            '<div class="box" style="background-color:#FFE733;text-align:center">' +
            '1' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-3');
          column3row4.innerHTML =
            '<div class="box" style="background-color:#ED2938;text-align:center">' +
            '2' +
            '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row4 as HTMLElement);

          // Rot    #ED2938       rgb(237,41,56)
          // Yellow #FFE733       rgb(255,231,51)
          // Orange #FF8C01       rgb(255,140,1)
          // Green  #006B3E       rgb(0,107,62)
          // Light Green #39d688  rgb(57,214,136)
        }
        ////////////////////////  End of Life Potential  ////////////////////////
        {
          const column4row1 = document.createElement('div');
          column4row1.setAttribute('class', 'p-col-3');
          column4row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'End of Life Potential' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row1 as HTMLElement);

          const box = column4row1.children[0];
          // Event Listeners
          box.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          box.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          box.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[3].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_end_of_life_potential === 0) {
                color = colorGreen;
              } else if (obj.attrIdParameter_end_of_life_potential === 1) {
                color = colorLightGreen;
              } else if (obj.attrIdParameter_end_of_life_potential === 2) {
                color = colorYellow;
              } else if (obj.attrIdParameter_end_of_life_potential === 3) {
                color = colorOrange;
              } else if (obj.attrIdParameter_end_of_life_potential === 4) {
                color = colorRed;
              }

              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
            });
          });

          const column4row2 = document.createElement('div');
          column4row2.setAttribute('class', 'p-col-1');
          column4row2.innerHTML =
            '<div class="box" style="background-color:#006B3E;text-align:center">' +
            '0' +
            '</div>';
          column4row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row2 as HTMLElement);

          const column4row3 = document.createElement('div');
          column4row3.setAttribute('class', 'p-col-2');
          column4row3.innerHTML =
            '<div class="box" style="background-color:#39d688;text-align:center">' +
            '1' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row3 as HTMLElement);

          const column4row4 = document.createElement('div');
          column4row4.setAttribute('class', 'p-col-2');
          column4row4.innerHTML =
            '<div class="box" style="background-color:#FFE733;text-align:center">' +
            '2' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row4 as HTMLElement);

          const column5row4 = document.createElement('div');
          column5row4.setAttribute('class', 'p-col-2');
          column5row4.innerHTML =
            '<div class="box" style="background-color:#FF8C01;text-align:center">' +
            '3' +
            '</div>';
          column5row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column5row4 as HTMLElement);

          const column6row4 = document.createElement('div');
          column6row4.setAttribute('class', 'p-col-2');
          column6row4.innerHTML =
            '<div class="box" style="background-color:#ED2938;text-align:center">' +
            '4' +
            '</div>';
          column6row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column6row4 as HTMLElement);
        }
      });
    } else if (this.group === 2) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb()
        .executeUserFunction(`function userFunction(pdb) {

      // Momentan vier Parameter
      var returnArr = new Array();
      returnArr[0] = new Array();
      returnArr[1] = new Array();
      returnArr[2] = new Array();
      returnArr[3] = new Array();
      returnArr[4] = new Array();
      returnArr[5] = new Array();
      returnArr[6] = new Array();

      var i = 0;

      pdb.enumObjects(dbId => {
        if (pdb.getObjectProperties(dbId, ['Number of Elements'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Number of Elements'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_numberOfElements: value};
          returnArr[0].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Lifespan'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Lifespan'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_lifespan: value};
          returnArr[1].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Reused'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Reused'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_reused: value};
          returnArr[2].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Reused Potential'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Reused Potential'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_reused_potential: value};
          returnArr[3].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Recycling Potential'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Recycling Potential'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_recycling_potential: value};
          returnArr[4].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Waste'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Waste'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_waste: value};
          returnArr[5].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Embodied CO2 Emissions'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Embodied CO2 Emissions'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_co2: value};
          returnArr[6].push(object);
        }
      });
      return returnArr;
  }`);

      const that = this;
      promise.then(function (retValue) {
        console.log(retValue);

        var container = that.viewerComponent.viewer.container as HTMLElement;
        that.panel = new Autodesk.Viewing.UI.DockingPanel(
          container,
          'parameterLegend',
          'Parameter Legend: Group ' + that.group,
          { localizeTitle: true, addFooter: true }
        );
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add(
          'docking-panel-container-solid-color-a'
        );
        that.panel.container.style.height = '250px';
        that.panel.container.style.width = '1000px';
        that.panel.container.style.minWidth = '1000px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container)
          .find('.docking-panel-close')
          .click((e) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            that.buttonMain.setState(1);
            $('#vertical-toolbar-button').attr(
              'style',
              'color: #FFFFFF !important ; background-color: #000080'
            );
            return false;
          });

        // Rot    #ED2938       rgb(237,41,56)
        // Yellow #FFE733       rgb(255,231,51)
        // Orange #FF8C01       rgb(255,140,1)
        // Green  #006B3E       rgb(0,107,62)
        // Light Green #39d688  rgb(57,214,136)

        const colorRed1 = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorRed2 = new THREE.Vector4(213 / 256, 70 / 256, 20 / 256, 1);
        const colorRed3 = new THREE.Vector4(185 / 256, 88 / 256, 0 / 256, 1);

        const colorRed4 = new THREE.Vector4(165 / 256, 105 / 256, 9 / 256, 1);
        const colorYellow = new THREE.Vector4(255 / 256, 157 / 256, 0 / 256, 1);
        const colorGreen4 = new THREE.Vector4(246 / 256, 238 / 256, 0 / 256, 1);

        const colorGreen3 = new THREE.Vector4(71 / 256, 111 / 256, 17 / 256, 1);
        const colorGreen2 = new THREE.Vector4(43 / 256, 110 / 256, 42 / 256, 1);
        const colorGreen1 = new THREE.Vector4(0 / 256, 107 / 256, 62 / 256, 1);

        ////////////////////////  Number of Elements  ////////////////////////
        {
          const column1row1 = document.createElement('div');
          column1row1.setAttribute('class', 'p-col-3');
          column1row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Number of Elements' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn1.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn1.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[0].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_numberOfElements === 8) {
                color = colorRed1;
              } else if (obj.attrIdParameter_numberOfElements === 7) {
                color = colorRed2;
              } else if (obj.attrIdParameter_numberOfElements === 6) {
                color = colorRed3;
              } else if (obj.attrIdParameter_numberOfElements === 5) {
                color = colorRed4;
              } else if (obj.attrIdParameter_numberOfElements === 4) {
                color = colorYellow;
              } else if (obj.attrIdParameter_numberOfElements === 3) {
                color = colorGreen4;
              } else if (obj.attrIdParameter_numberOfElements === 2) {
                color = colorGreen3;
              } else if (obj.attrIdParameter_numberOfElements === 1) {
                color = colorGreen2;
              }

              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );

              // if (that.viewerComponent.viewer.model.getInstanceTree().getChildCount(obj.dbId) !== 0) {
              //   that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
              // }
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-1');
          // column1row2.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(237, 41, 56) + ';text-align:center">' + '0' + '</div>';
          // column1row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-1');
          column1row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '1' +
            '</div>';
          column1row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-1');
          column1row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '2' +
            '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row4 as HTMLElement);

          const column1row5 = document.createElement('div');
          column1row5.setAttribute('class', 'p-col-1');
          column1row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '3' +
            '</div>';
          column1row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row5 as HTMLElement);

          const column1row6 = document.createElement('div');
          column1row6.setAttribute('class', 'p-col-1');
          column1row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(246, 238, 0) +
            ';text-align:center">' +
            '4' +
            '</div>';
          column1row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row6 as HTMLElement);

          const column1row7 = document.createElement('div');
          column1row7.setAttribute('class', 'p-col-1');
          column1row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(255, 157, 0) +
            ';text-align:center">' +
            '5' +
            '</div>';
          column1row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row7 as HTMLElement);

          const column1row8 = document.createElement('div');
          column1row8.setAttribute('class', 'p-col-1');
          column1row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(165, 105, 9) +
            ';text-align:center">' +
            '6' +
            '</div>';
          column1row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row8 as HTMLElement);

          const column1row9 = document.createElement('div');
          column1row9.setAttribute('class', 'p-col-1');
          column1row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '7' +
            '</div>';
          column1row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row9 as HTMLElement);

          const column1row10 = document.createElement('div');
          column1row10.setAttribute('class', 'p-col-1');
          column1row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '8' +
            '</div>';
          column1row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row10 as HTMLElement);
        }
        //////////////////////////  Lifespan  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Lifespan' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row1 as HTMLElement);

          const boxcolumn3 = column3row1.children[0];
          // Event Listeners
          boxcolumn3.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn3.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn3.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[1].forEach((obj) => {
              let color;
              if (
                obj.attrIdParameter_lifespan <= 4 &&
                obj.attrIdParameter_lifespan >= 1
              ) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_lifespan <= 10 &&
                obj.attrIdParameter_lifespan >= 5
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_lifespan <= 19 &&
                obj.attrIdParameter_lifespan >= 10
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_lifespan <= 39 &&
                obj.attrIdParameter_lifespan >= 20
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_lifespan <= 59 &&
                obj.attrIdParameter_lifespan >= 40
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_lifespan <= 69 &&
                obj.attrIdParameter_lifespan >= 60
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_lifespan <= 89 &&
                obj.attrIdParameter_lifespan >= 70
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_lifespan <= 99 &&
                obj.attrIdParameter_lifespan >= 90
              ) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_lifespan >= 100) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-1');
          column3row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '1 - 4' +
            '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-1');
          column3row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '5 - 10' +
            '</div>';
          column3row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-1');
          column3row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '10 - 19' +
            '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row4 as HTMLElement);

          const column3row5 = document.createElement('div');
          column3row5.setAttribute('class', 'p-col-1');
          column3row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(165, 105, 9) +
            ';text-align:center">' +
            '20 - 39' +
            '</div>';
          column3row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row5 as HTMLElement);

          const column3row6 = document.createElement('div');
          column3row6.setAttribute('class', 'p-col-1');
          column3row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(255, 157, 0) +
            ';text-align:center">' +
            '40 - 59' +
            '</div>';
          column3row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row6 as HTMLElement);

          const column3row7 = document.createElement('div');
          column3row7.setAttribute('class', 'p-col-1');
          column3row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(246, 238, 0) +
            ';text-align:center">' +
            '60 - 69' +
            '</div>';
          column3row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row7 as HTMLElement);

          const column3row8 = document.createElement('div');
          column3row8.setAttribute('class', 'p-col-1');
          column3row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '70 - 89' +
            '</div>';
          column3row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row8 as HTMLElement);

          const column3row9 = document.createElement('div');
          column3row9.setAttribute('class', 'p-col-1');
          column3row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '90 - 99' +
            '</div>';
          column3row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row9 as HTMLElement);

          const column3row10 = document.createElement('div');
          column3row10.setAttribute('class', 'p-col-1');
          column3row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '> 100' +
            '</div>';
          column3row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row10 as HTMLElement);
        }
        ////////////////////////  Reused  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' + 'Reused' + '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxcolumn2 = column2row1.children[0];
          // Event Listeners
          boxcolumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[2].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_reused === 0) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_reused <= 0.1 &&
                obj.attrIdParameter_reused > 0
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_reused <= 0.25 &&
                obj.attrIdParameter_reused > 0.1
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_reused <= 0.5 &&
                obj.attrIdParameter_reused > 0.25
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_reused <= 0.6 &&
                obj.attrIdParameter_reused > 0.5
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_reused <= 0.7 &&
                obj.attrIdParameter_reused > 0.6
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_reused <= 0.8 &&
                obj.attrIdParameter_reused > 0.7
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_reused <= 0.9 &&
                obj.attrIdParameter_reused > 0.8
              ) {
                color = colorGreen2;
              } else if (
                obj.attrIdParameter_reused <= 1 &&
                obj.attrIdParameter_reused > 0.9
              ) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-1');
          column2row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '0' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-1');
          column2row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '0 - 0.1' +
            '</div>';
          column2row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-1');
          column2row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '0.1 - 0.25' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          const column2row5 = document.createElement('div');
          column2row5.setAttribute('class', 'p-col-1');
          column2row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '0.25 - 0.5' +
            '</div>';
          column2row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row5 as HTMLElement);

          const column2row6 = document.createElement('div');
          column2row6.setAttribute('class', 'p-col-1');
          column2row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '0.5 - 0.6' +
            '</div>';
          column2row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row6 as HTMLElement);

          const column2row7 = document.createElement('div');
          column2row7.setAttribute('class', 'p-col-1');
          column2row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '0.6 - 0.7' +
            '</div>';
          column2row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row7 as HTMLElement);

          const column2row8 = document.createElement('div');
          column2row8.setAttribute('class', 'p-col-1');
          column2row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '0.7 - 0.8' +
            '</div>';
          column2row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row8 as HTMLElement);

          const column2row9 = document.createElement('div');
          column2row9.setAttribute('class', 'p-col-1');
          column2row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '0.8 - 0.9' +
            '</div>';
          column2row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row9 as HTMLElement);

          const column2row10 = document.createElement('div');
          column2row10.setAttribute('class', 'p-col-1');
          column2row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '0.9 - 1' +
            '</div>';
          column2row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row10 as HTMLElement);
        }
        ////////////////////////  Reused Potential  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Reused Potential' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxcolumn2 = column2row1.children[0];
          // Event Listeners
          boxcolumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[3].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_reused_potential === 0) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_reused_potential <= 0.1 &&
                obj.attrIdParameter_reused_potential > 0
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_reused_potential <= 0.25 &&
                obj.attrIdParameter_reused_potential > 0.1
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_reused_potential <= 0.5 &&
                obj.attrIdParameter_reused_potential > 0.25
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_reused_potential <= 0.6 &&
                obj.attrIdParameter_reused_potential > 0.5
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_reused_potential <= 0.7 &&
                obj.attrIdParameter_reused_potential > 0.6
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_reused_potential <= 0.8 &&
                obj.attrIdParameter_reused_potential > 0.7
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_reused_potential <= 0.9 &&
                obj.attrIdParameter_reused_potential > 0.8
              ) {
                color = colorGreen2;
              } else if (
                obj.attrIdParameter_reused_potential <= 1 &&
                obj.attrIdParameter_reused_potential > 0.9
              ) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-1');
          column2row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '0' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-1');
          column2row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '0 - 0.1' +
            '</div>';
          column2row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-1');
          column2row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '0.1 - 0.25' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          const column2row5 = document.createElement('div');
          column2row5.setAttribute('class', 'p-col-1');
          column2row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '0.25 - 0.5' +
            '</div>';
          column2row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row5 as HTMLElement);

          const column2row6 = document.createElement('div');
          column2row6.setAttribute('class', 'p-col-1');
          column2row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '0.5 - 0.6' +
            '</div>';
          column2row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row6 as HTMLElement);

          const column2row7 = document.createElement('div');
          column2row7.setAttribute('class', 'p-col-1');
          column2row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '0.6 - 0.7' +
            '</div>';
          column2row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row7 as HTMLElement);

          const column2row8 = document.createElement('div');
          column2row8.setAttribute('class', 'p-col-1');
          column2row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '0.7 - 0.8' +
            '</div>';
          column2row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row8 as HTMLElement);

          const column2row9 = document.createElement('div');
          column2row9.setAttribute('class', 'p-col-1');
          column2row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '0.8 - 0.9' +
            '</div>';
          column2row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row9 as HTMLElement);

          const column2row10 = document.createElement('div');
          column2row10.setAttribute('class', 'p-col-1');
          column2row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '0.9 - 1' +
            '</div>';
          column2row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row10 as HTMLElement);
        }
        ////////////////////////  Recycling Potential  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Recycling Potential' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxcolumn2 = column2row1.children[0];
          // Event Listeners
          boxcolumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[4].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_recycling_potential === 0) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_recycling_potential <= 0.1 &&
                obj.attrIdParameter_recycling_potential > 0
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_recycling_potential <= 0.25 &&
                obj.attrIdParameter_recycling_potential > 0.1
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_recycling_potential <= 0.5 &&
                obj.attrIdParameter_recycling_potential > 0.25
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_recycling_potential <= 0.6 &&
                obj.attrIdParameter_recycling_potential > 0.5
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_recycling_potential <= 0.7 &&
                obj.attrIdParameter_recycling_potential > 0.6
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_recycling_potential <= 0.8 &&
                obj.attrIdParameter_recycling_potential > 0.7
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_recycling_potential <= 0.9 &&
                obj.attrIdParameter_recycling_potential > 0.8
              ) {
                color = colorGreen2;
              } else if (
                obj.attrIdParameter_recycling_potential <= 1 &&
                obj.attrIdParameter_recycling_potential > 0.9
              ) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-1');
          column2row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '0' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-1');
          column2row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '0 - 0.1' +
            '</div>';
          column2row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-1');
          column2row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '0.1 - 0.25' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          const column2row5 = document.createElement('div');
          column2row5.setAttribute('class', 'p-col-1');
          column2row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '0.25 - 0.5' +
            '</div>';
          column2row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row5 as HTMLElement);

          const column2row6 = document.createElement('div');
          column2row6.setAttribute('class', 'p-col-1');
          column2row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '0.5 - 0.6' +
            '</div>';
          column2row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row6 as HTMLElement);

          const column2row7 = document.createElement('div');
          column2row7.setAttribute('class', 'p-col-1');
          column2row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '0.6 - 0.7' +
            '</div>';
          column2row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row7 as HTMLElement);

          const column2row8 = document.createElement('div');
          column2row8.setAttribute('class', 'p-col-1');
          column2row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '0.7 - 0.8' +
            '</div>';
          column2row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row8 as HTMLElement);

          const column2row9 = document.createElement('div');
          column2row9.setAttribute('class', 'p-col-1');
          column2row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '0.8 - 0.9' +
            '</div>';
          column2row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row9 as HTMLElement);

          const column2row10 = document.createElement('div');
          column2row10.setAttribute('class', 'p-col-1');
          column2row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '0.9 - 1' +
            '</div>';
          column2row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row10 as HTMLElement);
        }
        ////////////////////////  Waste  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' + 'Waste' + '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxcolumn2 = column2row1.children[0];
          // Event Listeners
          boxcolumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[5].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_waste === 0) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_waste <= 0.1 &&
                obj.attrIdParameter_waste > 0
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_waste <= 0.25 &&
                obj.attrIdParameter_waste > 0.1
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_waste <= 0.5 &&
                obj.attrIdParameter_waste > 0.25
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_waste <= 0.6 &&
                obj.attrIdParameter_waste > 0.5
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_waste <= 0.7 &&
                obj.attrIdParameter_waste > 0.6
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_waste <= 0.8 &&
                obj.attrIdParameter_waste > 0.7
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_waste <= 0.9 &&
                obj.attrIdParameter_waste > 0.8
              ) {
                color = colorGreen2;
              } else if (
                obj.attrIdParameter_waste <= 1 &&
                obj.attrIdParameter_waste > 0.9
              ) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-1');
          column2row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '0' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-1');
          column2row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '0 - 0.1' +
            '</div>';
          column2row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-1');
          column2row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '0.1 - 0.25' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          const column2row5 = document.createElement('div');
          column2row5.setAttribute('class', 'p-col-1');
          column2row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '0.25 - 0.5' +
            '</div>';
          column2row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row5 as HTMLElement);

          const column2row6 = document.createElement('div');
          column2row6.setAttribute('class', 'p-col-1');
          column2row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '0.5 - 0.6' +
            '</div>';
          column2row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row6 as HTMLElement);

          const column2row7 = document.createElement('div');
          column2row7.setAttribute('class', 'p-col-1');
          column2row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '0.6 - 0.7' +
            '</div>';
          column2row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row7 as HTMLElement);

          const column2row8 = document.createElement('div');
          column2row8.setAttribute('class', 'p-col-1');
          column2row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '0.7 - 0.8' +
            '</div>';
          column2row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row8 as HTMLElement);

          const column2row9 = document.createElement('div');
          column2row9.setAttribute('class', 'p-col-1');
          column2row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '0.8 - 0.9' +
            '</div>';
          column2row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row9 as HTMLElement);

          const column2row10 = document.createElement('div');
          column2row10.setAttribute('class', 'p-col-1');
          column2row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '0.9 - 1' +
            '</div>';
          column2row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row10 as HTMLElement);
        }
        ////////////////////////  Co2  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Embodied CO2 Emissions' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxcolumn2 = column2row1.children[0];
          // Event Listeners
          boxcolumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[6].forEach((obj) => {
              let color;
              if (
                obj.attrIdParameter_co2 <= 105392 &&
                obj.attrIdParameter_co2 > 100000
              ) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_co2 <= 100000 &&
                obj.attrIdParameter_co2 > 90000
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_co2 <= 90000 &&
                obj.attrIdParameter_co2 > 70000
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_co2 <= 70000 &&
                obj.attrIdParameter_co2 > 60000
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_co2 <= 60000 &&
                obj.attrIdParameter_co2 > 40000
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_co2 <= 40000 &&
                obj.attrIdParameter_co2 > 50000
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_co2 <= 20000 &&
                obj.attrIdParameter_co2 > 0
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_co2 <= 0 &&
                obj.attrIdParameter_co2 > -100000
              ) {
                color = colorGreen2;
              } else if (
                obj.attrIdParameter_co2 <= -100000 &&
                obj.attrIdParameter_co2 > -172264
              ) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-1');
          column2row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '100000 - 105392' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-1');
          column2row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '90000 - 100000' +
            '</div>';
          column2row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-1');
          column2row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '70000 - 90000' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          const column2row5 = document.createElement('div');
          column2row5.setAttribute('class', 'p-col-1');
          column2row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '60000 - 70000' +
            '</div>';
          column2row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row5 as HTMLElement);

          const column2row6 = document.createElement('div');
          column2row6.setAttribute('class', 'p-col-1');
          column2row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '40000 - 60000' +
            '</div>';
          column2row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row6 as HTMLElement);

          const column2row7 = document.createElement('div');
          column2row7.setAttribute('class', 'p-col-1');
          column2row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '20000 - 40000' +
            '</div>';
          column2row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row7 as HTMLElement);

          const column2row8 = document.createElement('div');
          column2row8.setAttribute('class', 'p-col-1');
          column2row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '0 - 20000' +
            '</div>';
          column2row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row8 as HTMLElement);

          const column2row9 = document.createElement('div');
          column2row9.setAttribute('class', 'p-col-1');
          column2row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '0 - -100000' +
            '</div>';
          column2row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row9 as HTMLElement);

          const column2row10 = document.createElement('div');
          column2row10.setAttribute('class', 'p-col-1');
          column2row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '-100000 - -172264' +
            '</div>';
          column2row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row10 as HTMLElement);
        }
      });
    } else if (this.group === 3) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb()
        .executeUserFunction(`function userFunction(pdb) {

      // Momentan vier Parameter
      var returnArr = new Array();
      returnArr[0] = new Array();
      returnArr[1] = new Array();
      returnArr[2] = new Array();
      returnArr[3] = new Array();

      var i = 0;

      pdb.enumObjects(dbId => {
        if( dbId === 80830 ) {
          console.log('FOUND');
        }
        if (pdb.getObjectProperties(dbId, ['Flexibility_Rating'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Flexibility_Rating'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_flexibility_rating: value};
          returnArr[0].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Environmental_Impact'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Environmental_Impact'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_environmental_impact: value};
          returnArr[1].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Circularity'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Circularity'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_circularity: value};
          returnArr[2].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Lifespan'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Lifespan'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_lifespan: value};
          returnArr[3].push(object);
        }
      });
      return returnArr;
  }`);

      const that = this;
      promise.then(function (retValue) {
        console.log(retValue);

        var container = that.viewerComponent.viewer.container as HTMLElement;
        that.panel = new Autodesk.Viewing.UI.DockingPanel(
          container,
          'parameterLegend',
          'Parameter Legend: Group ' + that.group,
          { localizeTitle: true, addFooter: true }
        );
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add(
          'docking-panel-container-solid-color-a'
        );
        that.panel.container.style.height = '250px';
        that.panel.container.style.width = '1000px';
        that.panel.container.style.minWidth = '1000px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container)
          .find('.docking-panel-close')
          .click((e) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            that.buttonMain.setState(1);
            $('#vertical-toolbar-button').attr(
              'style',
              'color: #FFFFFF !important ; background-color: #000080'
            );
            return false;
          });

        // Rot    #ED2938       rgb(237,41,56)
        // Yellow #FFE733       rgb(255,231,51)
        // Orange #FF8C01       rgb(255,140,1)
        // Green  #006B3E       rgb(0,107,62)
        // Light Green #39d688  rgb(57,214,136)

        const colorRed1 = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorRed2 = new THREE.Vector4(213 / 256, 70 / 256, 20 / 256, 1);
        const colorRed3 = new THREE.Vector4(185 / 256, 88 / 256, 0 / 256, 1);
        const colorRed4 = new THREE.Vector4(155 / 256, 100 / 256, 0 / 256, 1);
        const colorYellow = new THREE.Vector4(126 / 256, 107 / 256, 0 / 256, 1);
        const colorGreen4 = new THREE.Vector4(98 / 256, 110 / 256, 0 / 256, 1);
        const colorGreen3 = new THREE.Vector4(71 / 256, 111 / 256, 17 / 256, 1);
        const colorGreen2 = new THREE.Vector4(43 / 256, 110 / 256, 42 / 256, 1);
        const colorGreen1 = new THREE.Vector4(0 / 256, 107 / 256, 62 / 256, 1);

        ////////////////////////  Flexibility Rating  ////////////////////////
        {
          const column1row1 = document.createElement('div');
          column1row1.setAttribute('class', 'p-col-3');
          column1row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Flexibility Rating' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn1.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn1.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[0].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_flexibility_rating === 0) {
                color = colorRed1;
              } else if (obj.attrIdParameter_flexibility_rating === 1) {
                color = colorRed2;
              } else if (obj.attrIdParameter_flexibility_rating === 2) {
                color = colorRed3;
              } else if (obj.attrIdParameter_flexibility_rating === 3) {
                color = colorRed4;
              } else if (obj.attrIdParameter_flexibility_rating === 4) {
                color = colorYellow;
              } else if (obj.attrIdParameter_flexibility_rating === 5) {
                color = colorGreen4;
              } else if (obj.attrIdParameter_flexibility_rating === 6) {
                color = colorGreen3;
              } else if (obj.attrIdParameter_flexibility_rating === 7) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_flexibility_rating === 8) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-1');
          // column1row2.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(237, 41, 56) + ';text-align:center">' + '0' + '</div>';
          // column1row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-1');
          column1row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '1' +
            '</div>';
          column1row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-1');
          column1row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '2' +
            '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row4 as HTMLElement);

          const column1row5 = document.createElement('div');
          column1row5.setAttribute('class', 'p-col-1');
          column1row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '3' +
            '</div>';
          column1row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row5 as HTMLElement);

          const column1row6 = document.createElement('div');
          column1row6.setAttribute('class', 'p-col-1');
          column1row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '4' +
            '</div>';
          column1row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row6 as HTMLElement);

          const column1row7 = document.createElement('div');
          column1row7.setAttribute('class', 'p-col-1');
          column1row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '5' +
            '</div>';
          column1row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row7 as HTMLElement);

          const column1row8 = document.createElement('div');
          column1row8.setAttribute('class', 'p-col-1');
          column1row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '6' +
            '</div>';
          column1row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row8 as HTMLElement);

          const column1row9 = document.createElement('div');
          column1row9.setAttribute('class', 'p-col-1');
          column1row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '7' +
            '</div>';
          column1row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row9 as HTMLElement);

          const column1row10 = document.createElement('div');
          column1row10.setAttribute('class', 'p-col-1');
          column1row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '8' +
            '</div>';
          column1row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row10 as HTMLElement);
        }
        ////////////////////////  Environmental Impact  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Environmental Impact' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxcolumn2 = column2row1.children[0];
          // Event Listeners
          boxcolumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[1].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_environmental_impact > 400) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_environmental_impact <= 399 &&
                obj.attrIdParameter_environmental_impact >= 350
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_environmental_impact <= 349 &&
                obj.attrIdParameter_environmental_impact >= 300
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_environmental_impact <= 299 &&
                obj.attrIdParameter_environmental_impact >= 250
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_environmental_impact <= 249 &&
                obj.attrIdParameter_environmental_impact >= 200
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_environmental_impact <= 199 &&
                obj.attrIdParameter_environmental_impact >= 150
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_environmental_impact <= 149 &&
                obj.attrIdParameter_environmental_impact >= 100
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_environmental_impact <= 99 &&
                obj.attrIdParameter_environmental_impact >= 50
              ) {
                color = colorGreen2;
              } else if (
                obj.attrIdParameter_environmental_impact <= 49 &&
                obj.attrIdParameter_environmental_impact >= 0
              ) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-1');
          column2row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '> 400' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-1');
          column2row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '350 - 399' +
            '</div>';
          column2row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-1');
          column2row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '300 - 349' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          const column2row5 = document.createElement('div');
          column2row5.setAttribute('class', 'p-col-1');
          column2row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '250 - 299' +
            '</div>';
          column2row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row5 as HTMLElement);

          const column2row6 = document.createElement('div');
          column2row6.setAttribute('class', 'p-col-1');
          column2row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '200 - 249' +
            '</div>';
          column2row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row6 as HTMLElement);

          const column2row7 = document.createElement('div');
          column2row7.setAttribute('class', 'p-col-1');
          column2row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '150 - 199' +
            '</div>';
          column2row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row7 as HTMLElement);

          const column2row8 = document.createElement('div');
          column2row8.setAttribute('class', 'p-col-1');
          column2row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '100 - 149' +
            '</div>';
          column2row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row8 as HTMLElement);

          const column2row9 = document.createElement('div');
          column2row9.setAttribute('class', 'p-col-1');
          column2row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '50 - 99' +
            '</div>';
          column2row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row9 as HTMLElement);

          const column2row10 = document.createElement('div');
          column2row10.setAttribute('class', 'p-col-1');
          column2row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '0 - 49' +
            '</div>';
          column2row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row10 as HTMLElement);
        }
        ////////////////////////  Circularity  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Circularity' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row1 as HTMLElement);

          const boxcolumn3 = column3row1.children[0];
          // Event Listeners
          boxcolumn3.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn3.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn3.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[2].forEach((obj) => {
              let color;
              if (
                obj.attrIdParameter_circularity <= 19 &&
                obj.attrIdParameter_circularity >= 1
              ) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_circularity <= 29 &&
                obj.attrIdParameter_circularity >= 20
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_circularity <= 39 &&
                obj.attrIdParameter_circularity >= 30
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_circularity <= 49 &&
                obj.attrIdParameter_circularity >= 40
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_circularity <= 59 &&
                obj.attrIdParameter_circularity >= 50
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_circularity <= 69 &&
                obj.attrIdParameter_circularity >= 60
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_circularity <= 79 &&
                obj.attrIdParameter_circularity >= 70
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_circularity <= 89 &&
                obj.attrIdParameter_circularity >= 80
              ) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_circularity >= 90) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-1');
          column3row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '1 - 19' +
            '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-1');
          column3row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '20 - 29' +
            '</div>';
          column3row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-1');
          column3row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '30 - 39' +
            '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row4 as HTMLElement);

          const column3row5 = document.createElement('div');
          column3row5.setAttribute('class', 'p-col-1');
          column3row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '40 - 49' +
            '</div>';
          column3row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row5 as HTMLElement);

          const column3row6 = document.createElement('div');
          column3row6.setAttribute('class', 'p-col-1');
          column3row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '50 - 59' +
            '</div>';
          column3row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row6 as HTMLElement);

          const column3row7 = document.createElement('div');
          column3row7.setAttribute('class', 'p-col-1');
          column3row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '60 - 69' +
            '</div>';
          column3row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row7 as HTMLElement);

          const column3row8 = document.createElement('div');
          column3row8.setAttribute('class', 'p-col-1');
          column3row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '70 - 79' +
            '</div>';
          column3row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row8 as HTMLElement);

          const column3row9 = document.createElement('div');
          column3row9.setAttribute('class', 'p-col-1');
          column3row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '80 - 89' +
            '</div>';
          column3row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row9 as HTMLElement);

          const column3row10 = document.createElement('div');
          column3row10.setAttribute('class', 'p-col-1');
          column3row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '> 90' +
            '</div>';
          column3row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row10 as HTMLElement);
        }
        //////////////////////////  Lifespan  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Lifespan' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row1 as HTMLElement);

          const boxcolumn3 = column3row1.children[0];
          // Event Listeners
          boxcolumn3.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn3.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn3.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[3].forEach((obj) => {
              let color;
              if (
                obj.attrIdParameter_lifespan <= 4 &&
                obj.attrIdParameter_lifespan >= 1
              ) {
                color = colorRed1;
              } else if (
                obj.attrIdParameter_lifespan <= 5 &&
                obj.attrIdParameter_lifespan >= 9
              ) {
                color = colorRed2;
              } else if (
                obj.attrIdParameter_lifespan <= 19 &&
                obj.attrIdParameter_lifespan >= 10
              ) {
                color = colorRed3;
              } else if (
                obj.attrIdParameter_lifespan <= 29 &&
                obj.attrIdParameter_lifespan >= 20
              ) {
                color = colorRed4;
              } else if (
                obj.attrIdParameter_lifespan <= 39 &&
                obj.attrIdParameter_lifespan >= 30
              ) {
                color = colorYellow;
              } else if (
                obj.attrIdParameter_lifespan <= 49 &&
                obj.attrIdParameter_lifespan >= 40
              ) {
                color = colorGreen4;
              } else if (
                obj.attrIdParameter_lifespan <= 59 &&
                obj.attrIdParameter_lifespan >= 50
              ) {
                color = colorGreen3;
              } else if (
                obj.attrIdParameter_lifespan <= 69 &&
                obj.attrIdParameter_lifespan >= 60
              ) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_lifespan >= 70) {
                color = colorGreen1;
              }

              if (
                that.viewerComponent.viewer.model
                  .getInstanceTree()
                  .getChildCount(obj.dbId) !== 0
              ) {
                that.viewerComponent.viewer.setThemingColor(
                  obj.dbId,
                  color,
                  that.viewerComponent.viewer.model,
                  true
                );
              }
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-1');
          column3row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '1 - 4' +
            '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-1');
          column3row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(213, 70, 20) +
            ';text-align:center">' +
            '5 - 9' +
            '</div>';
          column3row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-1');
          column3row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(185, 88, 0) +
            ';text-align:center">' +
            '10 - 19' +
            '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row4 as HTMLElement);

          const column3row5 = document.createElement('div');
          column3row5.setAttribute('class', 'p-col-1');
          column3row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '20 - 29' +
            '</div>';
          column3row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row5 as HTMLElement);

          const column3row6 = document.createElement('div');
          column3row6.setAttribute('class', 'p-col-1');
          column3row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '30 - 39' +
            '</div>';
          column3row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row6 as HTMLElement);

          const column3row7 = document.createElement('div');
          column3row7.setAttribute('class', 'p-col-1');
          column3row7.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '40 - 49' +
            '</div>';
          column3row7.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row7 as HTMLElement);

          const column3row8 = document.createElement('div');
          column3row8.setAttribute('class', 'p-col-1');
          column3row8.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(71, 111, 17) +
            ';text-align:center">' +
            '50 - 59' +
            '</div>';
          column3row8.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row8 as HTMLElement);

          const column3row9 = document.createElement('div');
          column3row9.setAttribute('class', 'p-col-1');
          column3row9.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(43, 110, 42) +
            ';text-align:center">' +
            '60 - 69' +
            '</div>';
          column3row9.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row9 as HTMLElement);

          const column3row10 = document.createElement('div');
          column3row10.setAttribute('class', 'p-col-1');
          column3row10.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '> 70' +
            '</div>';
          column3row10.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row10 as HTMLElement);
        }
      });
    } else if (this.group === 4) {
      console.log('Group: ' + this.group);
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb()
        .executeUserFunction(`function userFunction(pdb) {

      // Momentan vier Parameter
      var returnArr = new Array();
      returnArr[0] = new Array();
      returnArr[1] = new Array();
      returnArr[2] = new Array();
      returnArr[3] = new Array();

      var i = 0;

      pdb.enumObjects(dbId => {
        if( dbId === 80830 ) {
          console.log('FOUND');
        }
        if (pdb.getObjectProperties(dbId, ['Beyond The Life Cycle'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Beyond The Life Cycle'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_beyond_the_life_cycle: value};
          returnArr[0].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Carbon Emissions'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Carbon Emissions'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_carbon_missions: value};
          returnArr[1].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Carbon Storage'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Carbon Storage'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_carbon_storage: value};
          returnArr[2].push(object);
        }
        if (pdb.getObjectProperties(dbId, ['Carbon Impact'], false)) {
          value = parseInt(pdb.getObjectProperties(dbId, ['Carbon Impact'], false).properties[0].displayValue);
          var object = {dbId: dbId, attrIdParameter_carbon_impact: value};
          returnArr[3].push(object);
        }
      });
      return returnArr;
  }`);

      const that = this;
      promise.then(function (retValue) {
        console.log(retValue);

        var container = that.viewerComponent.viewer.container as HTMLElement;
        that.panel = new Autodesk.Viewing.UI.DockingPanel(
          container,
          'parameterLegend',
          'Parameter Legend: Group ' + that.group,
          { localizeTitle: true, addFooter: true }
        );
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add(
          'docking-panel-container-solid-color-a'
        );
        that.panel.container.style.height = '250px';
        that.panel.container.style.width = '1000px';
        that.panel.container.style.minWidth = '1000px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container)
          .find('.docking-panel-close')
          .click((e) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            that.buttonMain.setState(1);
            $('#vertical-toolbar-button').attr(
              'style',
              'color: #FFFFFF !important ; background-color: #000080'
            );
            return false;
          });

        // Rot    #ED2938       rgb(237,41,56)
        // Yellow #FFE733       rgb(255,231,51)
        // Orange #FF8C01       rgb(255,140,1)
        // Green  #006B3E       rgb(0,107,62)
        // Light Green #39d688  rgb(57,214,136)

        const colorRed1 = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorRed2 = new THREE.Vector4(155 / 256, 100 / 256, 0 / 256, 1);
        const colorYellow = new THREE.Vector4(126 / 256, 107 / 256, 0 / 256, 1);
        const colorGreen2 = new THREE.Vector4(98 / 256, 110 / 256, 0 / 256, 1);
        const colorGreen1 = new THREE.Vector4(0 / 256, 107 / 256, 62 / 256, 1);

        ////////////////////////  1 Beyond The Life Cycle  ////////////////////////
        {
          const column1row1 = document.createElement('div');
          column1row1.setAttribute('class', 'p-col-2');
          column1row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Beyond The Life Cycle' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxColumn1.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxColumn1.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[0].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_beyond_the_life_cycle === 1) {
                color = colorRed1;
              } else if (obj.attrIdParameter_beyond_the_life_cycle === 2) {
                color = colorRed2;
              } else if (obj.attrIdParameter_beyond_the_life_cycle === 3) {
                color = colorYellow;
              } else if (obj.attrIdParameter_beyond_the_life_cycle === 4) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_beyond_the_life_cycle === 5) {
                color = colorGreen1;
              }

              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
              // if (
              //   that.viewerComponent.viewer.model
              //     .getInstanceTree()
              //     .getChildCount(obj.dbId) !== 0
              // ) {
              //   that.viewerComponent.viewer.setThemingColor(
              //     obj.dbId,
              //     color,
              //     that.viewerComponent.viewer.model,
              //     true
              //   );
              // }
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-2');
          column1row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '1' +
            '</div>';
          column1row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-2');
          column1row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '2' +
            '</div>';
          column1row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-2');
          column1row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '3' +
            '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row4 as HTMLElement);

          const column1row5 = document.createElement('div');
          column1row5.setAttribute('class', 'p-col-2');
          column1row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '4' +
            '</div>';
          column1row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row5 as HTMLElement);

          const column1row6 = document.createElement('div');
          column1row6.setAttribute('class', 'p-col-2');
          column1row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '5' +
            '</div>';
          column1row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column1row6 as HTMLElement);
        }
        ////////////////////////  2 Carbon Emissions  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-2');
          column2row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Carbon Emissions' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row1 as HTMLElement);

          const boxcolumn2 = column2row1.children[0];
          // Event Listeners
          boxcolumn2.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn2.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[1].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_carbon_missions === 1) {
                color = colorRed1;
              } else if (obj.attrIdParameter_carbon_missions === 2) {
                color = colorRed2;
              } else if (obj.attrIdParameter_carbon_missions === 3) {
                color = colorYellow;
              } else if (obj.attrIdParameter_carbon_missions === 4) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_carbon_missions === 5) {
                color = colorGreen1;
              }

              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
              // if (
              //   that.viewerComponent.viewer.model
              //     .getInstanceTree()
              //     .getChildCount(obj.dbId) !== 0
              // ) {
              //   that.viewerComponent.viewer.setThemingColor(
              //     obj.dbId,
              //     color,
              //     that.viewerComponent.viewer.model,
              //     true
              //   );
              // }
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-2');
          column2row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '1' +
            '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-2');
          column2row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '2' +
            '</div>';
          column2row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-2');
          column2row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '3' +
            '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row4 as HTMLElement);

          const column2row5 = document.createElement('div');
          column2row5.setAttribute('class', 'p-col-2');
          column2row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '4' +
            '</div>';
          column2row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row5 as HTMLElement);

          const column2row6 = document.createElement('div');
          column2row6.setAttribute('class', 'p-col-2');
          column2row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '5' +
            '</div>';
          column2row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column2row6 as HTMLElement);
        }
        ////////////////////////  3 Carbon Storage  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-2');
          column3row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Carbon Storage' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row1 as HTMLElement);

          const boxcolumn3 = column3row1.children[0];
          // Event Listeners
          boxcolumn3.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn3.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn3.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[2].forEach((obj) => {
              let color;
              if (obj.attrIdParameter_carbon_storage === 1) {
                color = colorRed1;
              } else if (obj.attrIdParameter_carbon_storage === 2) {
                color = colorRed2;
              } else if (obj.attrIdParameter_carbon_storage === 3) {
                color = colorYellow;
              } else if (obj.attrIdParameter_carbon_storage === 4) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_carbon_storage === 5) {
                color = colorGreen1;
              }
              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
              // if (
              //   that.viewerComponent.viewer.model
              //     .getInstanceTree()
              //     .getChildCount(obj.dbId) !== 0
              // ) {
              //   that.viewerComponent.viewer.setThemingColor(
              //     obj.dbId,
              //     color,
              //     that.viewerComponent.viewer.model,
              //     true
              //   );
              // }
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-2');
          column3row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '1' +
            '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-2');
          column3row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '2' +
            '</div>';
          column3row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-2');
          column3row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '3' +
            '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row4 as HTMLElement);

          const column3row5 = document.createElement('div');
          column3row5.setAttribute('class', 'p-col-2');
          column3row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '4' +
            '</div>';
          column3row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row5 as HTMLElement);

          const column3row6 = document.createElement('div');
          column3row6.setAttribute('class', 'p-col-2');
          column3row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '5' +
            '</div>';
          column3row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column3row6 as HTMLElement);
        }
        //////////////////////////  4 Carbon Impact  ////////////////////////
        {
          const column4row1 = document.createElement('div');
          column4row1.setAttribute('class', 'p-col-2');
          column4row1.innerHTML =
            '<div class="box" style="text-align:center">' +
            'Carbon Impact' +
            '</div>';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row1 as HTMLElement);

          const boxcolumn4 = column4row1.children[0];
          // Event Listeners
          boxcolumn4.addEventListener(
            'mouseover',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = '#000080';
              targetElement.style.color = 'white';
            },
            false
          );
          boxcolumn4.addEventListener(
            'mouseout',
            (event) => {
              const targetElement = event.target as HTMLElement;
              targetElement.style.backgroundColor = 'transparent';
              targetElement.style.color = 'black';
            },
            false
          );
          boxcolumn4.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(
              that.viewerComponent.viewer.model
            );
            retValue[3].forEach((obj) => {

              // console.log(obj);

              let color;
              if (obj.attrIdParameter_carbon_impact === 1) {
                color = colorRed1;
              } else if (obj.attrIdParameter_carbon_impact === 2) {
                color = colorRed2;
              } else if (obj.attrIdParameter_carbon_impact === 3) {
                color = colorYellow;
              } else if (obj.attrIdParameter_carbon_impact === 4) {
                color = colorGreen2;
              } else if (obj.attrIdParameter_carbon_impact === 5) {
                color = colorGreen1;
              }

              that.viewerComponent.viewer.setThemingColor(
                obj.dbId,
                color,
                that.viewerComponent.viewer.model,
                true
              );
              // if (
              //   that.viewerComponent.viewer.model
              //     .getInstanceTree()
              //     .getChildCount(obj.dbId) !== 0
              // ) {
              //   that.viewerComponent.viewer.setThemingColor(
              //     obj.dbId,
              //     color,
              //     that.viewerComponent.viewer.model,
              //     true
              //   );
              // }
            });
          });

          const column4row2 = document.createElement('div');
          column4row2.setAttribute('class', 'p-col-2');
          column4row2.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(237, 41, 56) +
            ';text-align:center">' +
            '1' +
            '</div>';
          column4row2.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row2 as HTMLElement);

          const column4row3 = document.createElement('div');
          column4row3.setAttribute('class', 'p-col-2');
          column4row3.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(155, 100, 0) +
            ';text-align:center">' +
            '2' +
            '</div>';
          column4row3.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row3 as HTMLElement);

          const column4row4 = document.createElement('div');
          column4row4.setAttribute('class', 'p-col-2');
          column4row4.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(126, 107, 0) +
            ';text-align:center">' +
            '3' +
            '</div>';
          column4row4.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row4 as HTMLElement);

          const column4row5 = document.createElement('div');
          column4row5.setAttribute('class', 'p-col-2');
          column4row5.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(98, 110, 0) +
            ';text-align:center">' +
            '4' +
            '</div>';
          column4row5.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row5 as HTMLElement);

          const column4row6 = document.createElement('div');
          column4row6.setAttribute('class', 'p-col-2');
          column4row6.innerHTML =
            '<div class="box" style="background-color:' +
            that.fullColorHex(0, 107, 62) +
            ';text-align:center">' +
            '5' +
            '</div>';
          column4row6.style.color = 'white';
          $(that.panel.container)
            .find('#legend')[0]
            .appendChild(column4row6 as HTMLElement);
        }
      });
    }
  }

  public rgbToHex(rgb) {
    let hex = Number(rgb).toString(16);
    if (hex.length < 2) {
      hex = '0' + hex;
    }
    return hex;
  }

  public fullColorHex(r, g, b) {
    const red = this.rgbToHex(r);
    const green = this.rgbToHex(g);
    const blue = this.rgbToHex(b);
    return '#' + red + green + blue;
  }

  public async selectionChanged(event: SelectionChangedEventArgs) {
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;

    console.log('dbIdArray');
    console.log(dbIdArray);

    console.log('parent');
    console.log(
      this.viewerComponent.viewer.model
        .getInstanceTree()
        .getNodeParentId(dbIdArray[0])
    );

    console.log('child');
    console.log(
      this.viewerComponent.viewer.model
        .getInstanceTree()
        .getChildCount(dbIdArray[0])
    );

    // //@ts-ignore
    // var nodeFinalName = this.instanceTree.getNodeName(dbIdArray[0]);

    // console.log(nodeFinalName);
    // console.log(this.instanceTree);

    // @ts-ignore
    this.viewerComponent.viewer.model.getProperties(
      dbIdArray[0],
      (res) => {
        console.log('Properties');
        console.log(res);
      },
      (err) => {
        console.log(err);
      }
    );

    // setThemingColor(dbId, color, model, recursive)
    // const color = new THREE.Vector4(256 / 256, 0 / 256, 0 / 256, 1);
    // this.viewerComponent.viewer.setThemingColor(dbIdArray[0], color, this.viewerComponent.viewer.model);

    // var parent = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]);
  }
}

// // // Button Building Design
// // const buttonBuildingDesign = new Autodesk.Viewing.UI.ComboButton('filter-toolbar-buttonBuildingDesign');
// // buttonBuildingDesign.addClass('filter-toolbar-buttonBuildingDesign');
// // buttonBuildingDesign.setIcon('adsk-icon-measure-area-new');
// // // Sub Buttons
// // const buttonColumnAboveGround = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonColumnAboveGround');
// // buttonColumnAboveGround.addClass('filter-toolbar-buttonColumnAboveGround');
// // // @ts-ignore
// // buttonColumnAboveGround.container.children[0].classList.add('fas', 'fa-caret-square-up');
// // buttonColumnAboveGround.setToolTip('Column Above Ground');
// // buttonColumnAboveGround.onClick = (event) => {
// //   this.viewerComponent.viewer.isolate(this.columnsAboveGround);
// // };

// // const buttonColumnUnderGround = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonColumnUnderGround');
// // buttonColumnUnderGround.addClass('filter-toolbar-buttonColumnUnderGround');
// // // @ts-ignore
// // buttonColumnUnderGround.container.children[0].classList.add('fas', 'fa-caret-square-down');
// // buttonColumnUnderGround.setToolTip('Column Under Ground');
// // buttonColumnUnderGround.onClick = (event) => {
// //   this.viewerComponent.viewer.isolate(this.columnsUnderGround);
// // };

// // const buttonSlab = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonSlab');
// // buttonSlab.addClass('filter-toolbar-buttonSlab');
// // // @ts-ignore
// // buttonSlab.container.children[0].classList.add('fab', 'fa-slack-hash');
// // buttonSlab.setToolTip('Slab');
// // buttonSlab.onClick = (event) => {
// //   this.viewerComponent.viewer.isolate(this.slabs);
// // };

// // const buttonFloor = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonFloor');
// // buttonFloor.addClass('filter-toolbar-buttonFloor');
// // // @ts-ignore
// // buttonFloor.container.children[0].classList.add('fas', 'fa-square-full');
// // buttonFloor.setToolTip('Floor');
// // buttonFloor.onClick = (event) => {
// //   this.viewerComponent.viewer.isolate(this.floors);
// // };

// // // @ts-ignore
// // buttonBuildingDesign.addControl(buttonColumnAboveGround);
// // // @ts-ignore
// // buttonBuildingDesign.addControl(buttonColumnUnderGround);
// // // @ts-ignore
// // buttonBuildingDesign.addControl(buttonSlab);
// // // @ts-ignore
// // buttonBuildingDesign.addControl(buttonFloor);

// // // Button Building Design
// // const buttonBuildingLayer = new Autodesk.Viewing.UI.ComboButton('filter-toolbar-buttonBuildingLayer');
// // buttonBuildingLayer.addClass('filter-toolbar-buttonBuildingLayer');
// // buttonBuildingLayer.setIcon('adsk-icon-structure');
// // // Sub Buttons
// // const buttonStructure = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonStructure');
// // buttonStructure.addClass('filter-toolbar-buttonStructure');
// // // @ts-ignore
// // buttonStructure.container.children[0].classList.add('fas', 'fa-home');
// // buttonStructure.setToolTip('Structure');

// // const buttonSkin = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonSkin');
// // buttonSkin.addClass('filter-toolbar-buttonSkin');
// // // @ts-ignore
// // buttonSkin.container.children[0].classList.add('fas', 'fa-layer-group');
// // buttonSkin.setToolTip('Skin');

// // const buttonServices = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonServices');
// // buttonServices.addClass('filter-toolbar-buttonServices');
// // // @ts-ignore
// // buttonServices.container.children[0].classList.add('fas', 'fa-cogs');
// // buttonServices.setToolTip('Services');

// // const buttonSpacePlan = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonSpacePlan');
// // buttonSpacePlan.addClass('filter-toolbar-buttonSpacePlan');
// // // @ts-ignore
// // buttonSpacePlan.container.children[0].classList.add('fas', 'fa-vector-square');
// // buttonSpacePlan.setToolTip('Space Plan');

// // const buttonStuff = new Autodesk.Viewing.UI.Button('filter-toolbar-buttonStuff');
// // buttonStuff.addClass('filter-toolbar-buttonStuff');
// // // @ts-ignore
// // buttonStuff.container.children[0].classList.add('fas', 'fa-random');
// // buttonStuff.setToolTip('Stuff');

// // // @ts-ignore
// // buttonBuildingLayer.addControl(buttonStructure);
// // // @ts-ignore
// // buttonBuildingLayer.addControl(buttonSkin);
// // // @ts-ignore
// // buttonBuildingLayer.addControl(buttonServices);
// // // @ts-ignore
// // buttonBuildingLayer.addControl(buttonSpacePlan);
// // // @ts-ignore
// // buttonBuildingLayer.addControl(buttonStuff);

// // // Control Group
// // const controlGroup = new Autodesk.Viewing.UI.ControlGroup('filter-toolbar-controlGroup');
// // controlGroup.addControl(buttonBuildingDesign);
// // controlGroup.addControl(buttonBuildingLayer);
// // // Toolbar
// // const toolbarGroup2 = new Autodesk.Viewing.UI.ToolBar('filter-toolbar', { collapsible: false, alignVertically: true });
// // // buttonBuildingDesign.onClick = (event) => {
// // //   if (buttonBuildingDesign.getState() === 1) {
// // //     $('#filter-toolbar-buttonBuildingDesign').attr('style', 'color: #000000 !important ; background-color: #FFFFFF');
// // //     buttonBuildingDesign.setState(0);
// // //     // this.coloringModelNew();
// // //   }
// // //   else {
// // //     buttonBuildingDesign.setState(1);
// // //     $('#filter-toolbar-buttonBuildingDesign').attr('style', 'color: #FFFFFF !important ; background-color: #000080');
// // //     // this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
// // //     // this.panel.setVisible(false);
// // //   }
// // // };
// // toolbarGroup2.addControl(controlGroup);
// // $(this.viewerComponent.viewer.container).append(toolbarGroup2.container);
// // });
