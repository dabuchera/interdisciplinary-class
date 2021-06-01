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

import { AuthToken } from 'forge-apis';
import { ApiService } from 'src/app/_services/api.service';

import { MessageService } from 'primeng/api';

import * as $ from 'jquery';
declare var THREE: any;

import html from './legendTemplate.html';

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

  public group: number;

  // Für ng build github
  public message: any;

  // Model stuff
  leafcomponents = [];

  public instanceTree: Autodesk.Viewing.InstanceTree;

  public propertyDatabase: any;


  @ViewChild(ViewerComponent, { static: false })
  viewerComponent: ViewerComponent;

  constructor(private api: ApiService, private messageService: MessageService, private componentFactoryResolver: ComponentFactoryResolver) {
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

        // Hide container where model is in
        $('canvas').hide();
        this.replaceSpinner();
        $('.lds-roller').show();
        this.viewerComponent.viewer.setGhosting(false);
        // $('canvas').show();


        this.app.openOverlay();
        this.messageService.add({ key: 'chooseGroup', sticky: true, severity: 'warn', summary: 'GROUP', detail: 'Choose your group' });

        // this.choosedGroup1();

        // @ts-ignore
        await Autodesk.Viewing.EventUtils.waitUntilGeometryLoaded(this.viewerComponent.viewer).then(res => {
          // Instantiation of model stuff
          this.instanceTree = this.viewerComponent.viewer.model.getData().instanceTree;
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

  ngOnInit(): void { }

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
    this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: "You're seeing the model of Group 1", life: 5000 });

    // model1group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDFncm91cDEucnZ0

    // model2group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDJncm91cDEucnZ0

    // model3group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDNncm91cDEucnZ0

    // model4group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDEucnZ0

    // model5group1 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDVncm91cDEucnZ0

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: group1.rvt

    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9ncm91cDEucnZ0';

    // this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDEucnZ0';
  }


  choosedGroup2() {
    this.group = 2;
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: "You're seeing the model of Group 2", life: 5000 });

    // model2group2 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDFncm91cDIucnZ0

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: model2group2.rvt
    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDJncm91cDIucnZ0';
  }

  choosedGroup3() {
    this.group = 3;
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: "You're seeing the model of Group 3", life: 5000 });

    // model1group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDFncm91cDMucnZ0

    // model2group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDJncm91cDMucnZ0

    // model3group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDNncm91cDMucnZ0

    // model4group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDMucnZ0

    // model5group3 dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDVncm91cDMucnZ0

    // testdecal dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS90ZXN0ZGVjYWwucnZ0

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: group3.rvt

    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9ncm91cDMucnZ0';
  }

  public loadVerticalToolbar() {
    // Button 1
    this.buttonMain = new Autodesk.Viewing.UI.Button('vertical-toolbar-button');
    this.buttonMain.addClass('vertical-toolbar-button');
    // @ts-ignore
    this.buttonMain.container.children[0].classList.add('fas', 'fa-palette');
    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup('vertical-toolbar-controlGroup');
    controlGroup.addControl(this.buttonMain);
    // Toolbar
    const toolbarFacade = new Autodesk.Viewing.UI.ToolBar('vertical-toolbar', { collapsible: false, alignVertically: true });
    this.buttonMain.onClick = (event) => {
      if (this.buttonMain.getState() === 1) {
        $('#vertical-toolbar-button').attr('style', 'color: #000000 !important ; background-color: #FFFFFF');
        this.buttonMain.setState(0);
        this.coloringModelNew();
      }
      else {
        this.buttonMain.setState(1);
        $('#vertical-toolbar-button').attr('style', 'color: #FFFFFF !important ; background-color: #000080');
        this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
        this.panel.setVisible(false);
      }
    };
    toolbarFacade.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(toolbarFacade.container);
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
    const instanceTree = this.viewerComponent.viewer.model.getData()
      .instanceTree;
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
      var promise = this.viewerComponent.viewer.model.getPropertyDb().executeUserFunction(`function userFunction(pdb) {

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
      promise.then(retValue => {

        console.log(retValue);

        const color = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);

        const dbIdToIndex = this.viewerComponent.viewer.model.getInstanceTree().nodeAccess.dbIdToIndex;
        for (let index = 0; index < retValue[0].length; index++) {
          console.log(retValue[0][index]);
          this.viewerComponent.viewer.setThemingColor(parseInt(Object.keys(dbIdToIndex).find(key => dbIdToIndex[key] === retValue[0][index].dbId)), color, that.viewerComponent.viewer.model, true);
        }
        console.log(retValue);
        console.log(this.viewerComponent.viewer.model.getInstanceTree().nodeAccess);
        console.log(this.viewerComponent.viewer.model.getInstanceTree().nodeAccess.dbIdToIndex[30]);

        var container = that.viewerComponent.viewer.container as HTMLElement;
        that.panel = new Autodesk.Viewing.UI.DockingPanel(container, 'parameterLegend', 'Parameter Legend: Group ' + that.group, { localizeTitle: true, addFooter: true });
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add('docking-panel-container-solid-color-a');
        that.panel.container.style.height = '350px';
        that.panel.container.style.width = '650px';
        that.panel.container.style.minWidth = '650px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container).find('.docking-panel-close').click((e) => {
          that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
          that.buttonMain.setState(1);
          $('#vertical-toolbar-button').attr('style', 'color: #FFFFFF !important ; background-color: #000080');
          return false;
        });

        // Rot    #ED2938       rgb(237,41,56)
        // Yellow #FFE733       rgb(255,231,51)
        // Orange #FF8C01       rgb(255,140,1)
        // Green  #006B3E       rgb(0,107,62)
        // Light Green #39d688  rgb(57,214,136)

        const colorRed = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorYellow = new THREE.Vector4(255 / 256, 231 / 256, 51 / 256, 1);
        const colorOrange = new THREE.Vector4(255 / 256, 140 / 256, 1 / 256, 1);
        const colorGreen = new THREE.Vector4(0 / 256, 107 / 256, 62 / 256, 1);
        const colorLightGreen = new THREE.Vector4(57 / 256, 214 / 256, 136 / 256, 1);

        ////////////////////////  Geographical Origin  ////////////////////////
        {
          const column1row1 = document.createElement('div');
          column1row1.setAttribute('class', 'p-col-3');
          column1row1.innerHTML = '<div class="box" style="text-align:center">' + 'Geographical Origin' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxColumn1.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxColumn1.addEventListener('click', async (event) => {
            retValue[0].forEach(obj => {
              let color;
              if (obj.attrIdParameter_geographical_origin === 0) {
                color = colorGreen;
              }
              else if (obj.attrIdParameter_geographical_origin === 1) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_geographical_origin === 2) {
                color = colorRed;
              }
              that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-3');
          column1row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
          column1row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-3');
          column1row3.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '1' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-3');
          column1row4.innerHTML = '<div class="box" style="background-color:#ED2938;text-align:center">' + '2' + '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row4 as HTMLElement);
        }
        ////////////////////////  Life Cycle Origin  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML = '<div class="box" style="text-align:center">' + 'Life Cycle Origin' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column2row1 as HTMLElement);

          const boxColumn2 = column2row1.children[0];
          // Event Listeners
          boxColumn2.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxColumn2.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxColumn2.addEventListener('click', async (event) => {
            retValue[1].forEach(obj => {
              let color;
              if (obj.attrIdParameter_life_cycle_origin === 0) {
                color = colorGreen;
              }
              else if (obj.attrIdParameter_life_cycle_origin === 1) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_life_cycle_origin === 2) {
                color = colorOrange;
              }
              that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-3');
          column2row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-3');
          column2row3.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '1' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-3');
          column2row4.innerHTML = '<div class="box" style="background-color:#FF8C01;text-align:center">' + '2' + '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row4 as HTMLElement);

          // Rot    #ED2938   rgb(237,41,56)
          // Yellow #FFE733   rgb(255,231,51)
          // Orange #FF8C01   rgb(255,140,1)
          // Green  #006B3E   rgb(0,107,62)
        }
        ////////////////////////  Flexibility Rating  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML = '<div class="box" style="text-align:center">' + 'Flexibility Rating' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column3row1 as HTMLElement);

          const boxColumn3 = column3row1.children[0];
          // Event Listeners
          boxColumn3.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxColumn3.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxColumn3.addEventListener('click', async (event) => {
            retValue[2].forEach(obj => {
              let color;
              if (obj.attrIdParameter_flexibility_rating === 0) {
                color = colorGreen;
              }
              else if (obj.attrIdParameter_flexibility_rating === 1) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_flexibility_rating === 2) {
                color = colorRed;
              }
              that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-3');
          column3row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-3');
          column3row3.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '1' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-3');
          column3row4.innerHTML = '<div class="box" style="background-color:#ED2938;text-align:center">' + '2' + '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row4 as HTMLElement);

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
          column4row1.innerHTML = '<div class="box" style="text-align:center">' + 'End of Life Potential' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column4row1 as HTMLElement);

          const box = column4row1.children[0];
          // Event Listeners
          box.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          box.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          box.addEventListener('click', async (event) => {
            retValue[3].forEach(obj => {
              let color;
              if (obj.attrIdParameter_end_of_life_potential === 0) {
                color = colorGreen;
              }
              else if (obj.attrIdParameter_end_of_life_potential === 1) {
                color = colorLightGreen;
              }
              else if (obj.attrIdParameter_end_of_life_potential === 2) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_end_of_life_potential === 3) {
                color = colorOrange;
              }
              else if (obj.attrIdParameter_end_of_life_potential === 4) {
                color = colorRed;
              }
              that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column4row2 = document.createElement('div');
          column4row2.setAttribute('class', 'p-col-1');
          column4row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
          column4row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column4row2 as HTMLElement);

          const column4row3 = document.createElement('div');
          column4row3.setAttribute('class', 'p-col-2');
          column4row3.innerHTML = '<div class="box" style="background-color:#39d688;text-align:center">' + '1' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column4row3 as HTMLElement);

          const column4row4 = document.createElement('div');
          column4row4.setAttribute('class', 'p-col-2');
          column4row4.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '2' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column4row4 as HTMLElement);

          const column5row4 = document.createElement('div');
          column5row4.setAttribute('class', 'p-col-2');
          column5row4.innerHTML = '<div class="box" style="background-color:#FF8C01;text-align:center">' + '3' + '</div>';
          column5row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column5row4 as HTMLElement);

          const column6row4 = document.createElement('div');
          column6row4.setAttribute('class', 'p-col-2');
          column6row4.innerHTML = '<div class="box" style="background-color:#ED2938;text-align:center">' + '4' + '</div>';
          column6row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column6row4 as HTMLElement);
        }
      });
    }

    else if (this.group === 2) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb().executeUserFunction(`function userFunction(pdb) {
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
          this.messageService.add({ key: 'warning', sticky: true, severity: 'error', summary: 'Coloring', detail: 'Model doesn\'t contain property \'Flexibility_Rating\'.' });
          return;
        }

        console.log(retValue);

        const colorRed = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorOrange = new THREE.Vector4(255 / 256, 140 / 256, 1 / 256, 1);
        const colorYellow = new THREE.Vector4(255 / 256, 231 / 256, 51 / 256, 1);
        const colorGreen = new THREE.Vector4(0 / 256, 132 / 256, 80 / 256, 1);

        const instanceTree = that.instanceTree;
        const rootNodeId = instanceTree.getRootId();
        that.viewerComponent.viewer.setThemingColor(rootNodeId, colorRed, that.viewerComponent.viewer.model, true);

        // const traverseRecursively = true;
        // function callback(dbid) {
        //   console.log('Found object ID', dbid);
        // }
        // instanceTree.enumNodeChildren(rootNodeId, callback, traverseRecursively);

        retValue[0].forEach(dbid => {
          if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
            that.viewerComponent.viewer.setThemingColor(dbid + 2, colorRed, that.viewerComponent.viewer.model, true);
          }
          else {
            that.viewerComponent.viewer.setThemingColor(dbid, colorRed, that.viewerComponent.viewer.model, true);
          }
        });
        retValue[1].forEach(dbid => {
          if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
            that.viewerComponent.viewer.setThemingColor(dbid + 2, colorOrange, that.viewerComponent.viewer.model, true);
          }
          else {
            that.viewerComponent.viewer.setThemingColor(dbid, colorOrange, that.viewerComponent.viewer.model, true);
          }
        });
        retValue[2].forEach(dbid => {
          if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
            that.viewerComponent.viewer.setThemingColor(dbid + 2, colorYellow, that.viewerComponent.viewer.model, true);
          }
          else {
            that.viewerComponent.viewer.setThemingColor(dbid, colorYellow, that.viewerComponent.viewer.model, true);
          }
        });
        retValue[3].forEach(dbid => {
          if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
            that.viewerComponent.viewer.setThemingColor(dbid + 2, colorGreen, that.viewerComponent.viewer.model, true);
          }
          else {
            that.viewerComponent.viewer.setThemingColor(dbid, colorGreen, that.viewerComponent.viewer.model, true);
          }
        });
        // var mostMassiveId = retValue.id;
        // that.viewerComponent.viewer.select(mostMassiveId);
        // that.viewerComponent.viewer.fitToView([mostMassiveId]);
        // console.log('Most massive part is', mostMassiveId, 'with Mass:', retValue.mass);
      });
    }

    else if (this.group === 3) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb().executeUserFunction(`function userFunction(pdb) {

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
        that.panel = new Autodesk.Viewing.UI.DockingPanel(container, 'parameterLegend', 'Parameter Legend: Group ' + that.group, { localizeTitle: true, addFooter: true });
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add('docking-panel-container-solid-color-a');
        that.panel.container.style.height = '350px';
        that.panel.container.style.width = '650px';
        that.panel.container.style.minWidth = '650px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container).find('.docking-panel-close').click((e) => {
          that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
          that.buttonMain.setState(1);
          $('#vertical-toolbar-button').attr('style', 'color: #FFFFFF !important ; background-color: #000080');
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
          column1row1.innerHTML = '<div class="box" style="text-align:center">' + 'Flexibility Rating' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxColumn1.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxColumn1.addEventListener('click', async (event) => {
            retValue[0].forEach(obj => {
              let color;
              if (obj.attrIdParameter_flexibility_rating === 0) {
                color = colorRed1;
              }
              else if (obj.attrIdParameter_flexibility_rating === 1) {
                color = colorRed2;
              }
              else if (obj.attrIdParameter_flexibility_rating === 2) {
                color = colorRed3;
              }
              if (obj.attrIdParameter_flexibility_rating === 3) {
                color = colorRed4;
              }
              else if (obj.attrIdParameter_flexibility_rating === 4) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_flexibility_rating === 5) {
                color = colorGreen4;
              }
              if (obj.attrIdParameter_flexibility_rating === 6) {
                color = colorGreen3;
              }
              else if (obj.attrIdParameter_flexibility_rating === 7) {
                color = colorGreen2;
              }
              else if (obj.attrIdParameter_flexibility_rating === 8) {
                color = colorGreen1;
              }
              // console.log('parent');
              // console.log(this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]));

              // console.log('child');
              // console.log(this.viewerComponent.viewer.model.getInstanceTree().getChildCount(dbIdArray[0]));
              that.viewerComponent.viewer.setThemingColor(obj.dbId + 4, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-1');
          column1row2.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(237, 41, 56) + ';text-align:center">' + '0' + '</div>';
          column1row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-1');
          column1row3.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(213, 70, 20) + ';text-align:center">' + '1' + '</div>';
          column1row3.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-1');
          column1row4.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(185, 88, 0) + ';text-align:center">' + '2' + '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row4 as HTMLElement);

          const column1row5 = document.createElement('div');
          column1row5.setAttribute('class', 'p-col-1');
          column1row5.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(155, 100, 0) + ';text-align:center">' + '3' + '</div>';
          column1row5.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row5 as HTMLElement);

          const column1row6 = document.createElement('div');
          column1row6.setAttribute('class', 'p-col-1');
          column1row6.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(126, 107, 0) + ';text-align:center">' + '4' + '</div>';
          column1row6.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row6 as HTMLElement);

          const column1row7 = document.createElement('div');
          column1row7.setAttribute('class', 'p-col-1');
          column1row7.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(98, 110, 0) + ';text-align:center">' + '5' + '</div>';
          column1row7.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row7 as HTMLElement);

          const column1row8 = document.createElement('div');
          column1row8.setAttribute('class', 'p-col-1');
          column1row8.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(71, 111, 17) + ';text-align:center">' + '6' + '</div>';
          column1row8.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row8 as HTMLElement);

          const column1row9 = document.createElement('div');
          column1row9.setAttribute('class', 'p-col-1');
          column1row9.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(43, 110, 42) + ';text-align:center">' + '7' + '</div>';
          column1row9.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row9 as HTMLElement);

          const column1row10 = document.createElement('div');
          column1row10.setAttribute('class', 'p-col-1');
          column1row10.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(0, 107, 62) + ';text-align:center">' + '8' + '</div>';
          column1row10.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row10 as HTMLElement);

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
      var promise = this.viewerComponent.viewer.model.getPropertyDb().executeUserFunction(`function userFunction(pdb) {

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
      promise.then(retValue => {

        console.log(retValue);

        var container = that.viewerComponent.viewer.container as HTMLElement;
        that.panel = new Autodesk.Viewing.UI.DockingPanel(container, 'parameterLegend', 'Parameter Legend: Group ' + that.group, { localizeTitle: true, addFooter: true });
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add('docking-panel-container-solid-color-a');
        that.panel.container.style.height = '350px';
        that.panel.container.style.width = '650px';
        that.panel.container.style.minWidth = '650px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container).find('.docking-panel-close').click((e) => {
          that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
          that.buttonMain.setState(1);
          $('#vertical-toolbar-button').attr('style', 'color: #FFFFFF !important ; background-color: #000080');
          return false;
        });

        // Rot    #ED2938       rgb(237,41,56)
        // Yellow #FFE733       rgb(255,231,51)
        // Orange #FF8C01       rgb(255,140,1)
        // Green  #006B3E       rgb(0,107,62)
        // Light Green #39d688  rgb(57,214,136)

        const colorRed = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorYellow = new THREE.Vector4(255 / 256, 231 / 256, 51 / 256, 1);
        const colorOrange = new THREE.Vector4(255 / 256, 140 / 256, 1 / 256, 1);
        const colorGreen = new THREE.Vector4(0 / 256, 107 / 256, 62 / 256, 1);
        const colorLightGreen = new THREE.Vector4(57 / 256, 214 / 256, 136 / 256, 1);

        ////////////////////////  Geographical Origin  ////////////////////////
        {
          const column1row1 = document.createElement('div');
          column1row1.setAttribute('class', 'p-col-3');
          column1row1.innerHTML = '<div class="box" style="text-align:center">' + 'Geographical Origin' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxColumn1.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxColumn1.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
            retValue[0].forEach(obj => {
              let color;
              if (obj.attrIdParameter_geographical_origin === 0) {
                color = colorGreen;
              }
              else if (obj.attrIdParameter_geographical_origin === 1) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_geographical_origin === 2) {
                color = colorRed;
              }

              that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-3');
          column1row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
          column1row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-3');
          column1row3.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '1' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-3');
          column1row4.innerHTML = '<div class="box" style="background-color:#ED2938;text-align:center">' + '2' + '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row4 as HTMLElement);

          // Rot    #ED2938   rgb(237,41,56)
          // Yellow #FFE733   rgb(255,231,51)
          // Orange #FF8C01   rgb(255,140,1)
          // Green  #006B3E   rgb(0,107,62)
        }
        ////////////////////////  Life Cycle Origin  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML = '<div class="box" style="text-align:center">' + 'Life Cycle Origin' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column2row1 as HTMLElement);

          const boxColumn2 = column2row1.children[0];
          // Event Listeners
          boxColumn2.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxColumn2.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxColumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
            retValue[1].forEach(obj => {
              let color;
              if (obj.attrIdParameter_life_cycle_origin === 0) {
                color = colorGreen;
              }
              else if (obj.attrIdParameter_life_cycle_origin === 1) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_life_cycle_origin === 2) {
                color = colorOrange;
              }

              that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-3');
          column2row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-3');
          column2row3.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '1' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-3');
          column2row4.innerHTML = '<div class="box" style="background-color:#FF8C01;text-align:center">' + '2' + '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row4 as HTMLElement);

          // Rot    #ED2938   rgb(237,41,56)
          // Yellow #FFE733   rgb(255,231,51)
          // Orange #FF8C01   rgb(255,140,1)
          // Green  #006B3E   rgb(0,107,62)
        }
        ////////////////////////  Flexibility Rating  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML = '<div class="box" style="text-align:center">' + 'Flexibility Rating' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column3row1 as HTMLElement);

          const boxColumn3 = column3row1.children[0];
          // Event Listeners
          boxColumn3.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxColumn3.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxColumn3.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
            retValue[2].forEach(obj => {
              let color;
              if (obj.attrIdParameter_flexibility_rating === 0) {
                color = colorGreen;
              }
              else if (obj.attrIdParameter_flexibility_rating === 1) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_flexibility_rating === 2) {
                color = colorRed;
              }

              that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-3');
          column3row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-3');
          column3row3.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '1' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-3');
          column3row4.innerHTML = '<div class="box" style="background-color:#ED2938;text-align:center">' + '2' + '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row4 as HTMLElement);

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
          column4row1.innerHTML = '<div class="box" style="text-align:center">' + 'End of Life Potential' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column4row1 as HTMLElement);

          const box = column4row1.children[0];
          // Event Listeners
          box.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          box.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          box.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
            retValue[3].forEach(obj => {
              let color;
              if (obj.attrIdParameter_end_of_life_potential === 0) {
                color = colorGreen;
              }
              else if (obj.attrIdParameter_end_of_life_potential === 1) {
                color = colorLightGreen;
              }
              else if (obj.attrIdParameter_end_of_life_potential === 2) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_end_of_life_potential === 3) {
                color = colorOrange;
              }
              else if (obj.attrIdParameter_end_of_life_potential === 4) {
                color = colorRed;
              }

              that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
            });
          });

          const column4row2 = document.createElement('div');
          column4row2.setAttribute('class', 'p-col-1');
          column4row2.innerHTML = '<div class="box" style="background-color:#006B3E;text-align:center">' + '0' + '</div>';
          column4row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column4row2 as HTMLElement);

          const column4row3 = document.createElement('div');
          column4row3.setAttribute('class', 'p-col-2');
          column4row3.innerHTML = '<div class="box" style="background-color:#39d688;text-align:center">' + '1' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column4row3 as HTMLElement);

          const column4row4 = document.createElement('div');
          column4row4.setAttribute('class', 'p-col-2');
          column4row4.innerHTML = '<div class="box" style="background-color:#FFE733;text-align:center">' + '2' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column4row4 as HTMLElement);

          const column5row4 = document.createElement('div');
          column5row4.setAttribute('class', 'p-col-2');
          column5row4.innerHTML = '<div class="box" style="background-color:#FF8C01;text-align:center">' + '3' + '</div>';
          column5row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column5row4 as HTMLElement);

          const column6row4 = document.createElement('div');
          column6row4.setAttribute('class', 'p-col-2');
          column6row4.innerHTML = '<div class="box" style="background-color:#ED2938;text-align:center">' + '4' + '</div>';
          column6row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column6row4 as HTMLElement);
        }
      });
    }

    else if (this.group === 2) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb().executeUserFunction(`function userFunction(pdb) {
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
          this.messageService.add({ key: 'warning', sticky: true, severity: 'error', summary: 'Coloring', detail: 'Model doesn\'t contain property \'Flexibility_Rating\'.' });
          return;
        }

        console.log(retValue);

        const colorRed = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        const colorOrange = new THREE.Vector4(255 / 256, 140 / 256, 1 / 256, 1);
        const colorYellow = new THREE.Vector4(255 / 256, 231 / 256, 51 / 256, 1);
        const colorGreen = new THREE.Vector4(0 / 256, 132 / 256, 80 / 256, 1);

        const instanceTree = that.instanceTree;
        const rootNodeId = instanceTree.getRootId();
        that.viewerComponent.viewer.setThemingColor(rootNodeId, colorRed, that.viewerComponent.viewer.model, true);

        // const traverseRecursively = true;
        // function callback(dbid) {
        //   console.log('Found object ID', dbid);
        // }
        // instanceTree.enumNodeChildren(rootNodeId, callback, traverseRecursively);

        retValue[0].forEach(dbid => {
          if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
            that.viewerComponent.viewer.setThemingColor(dbid + 2, colorRed, that.viewerComponent.viewer.model, true);
          }
          else {
            that.viewerComponent.viewer.setThemingColor(dbid, colorRed, that.viewerComponent.viewer.model, true);
          }
        });
        retValue[1].forEach(dbid => {
          if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
            that.viewerComponent.viewer.setThemingColor(dbid + 2, colorOrange, that.viewerComponent.viewer.model, true);
          }
          else {
            that.viewerComponent.viewer.setThemingColor(dbid, colorOrange, that.viewerComponent.viewer.model, true);
          }
        });
        retValue[2].forEach(dbid => {
          if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
            that.viewerComponent.viewer.setThemingColor(dbid + 2, colorYellow, that.viewerComponent.viewer.model, true);
          }
          else {
            that.viewerComponent.viewer.setThemingColor(dbid, colorYellow, that.viewerComponent.viewer.model, true);
          }
        });
        retValue[3].forEach(dbid => {
          if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
            that.viewerComponent.viewer.setThemingColor(dbid + 2, colorGreen, that.viewerComponent.viewer.model, true);
          }
          else {
            that.viewerComponent.viewer.setThemingColor(dbid, colorGreen, that.viewerComponent.viewer.model, true);
          }
        });
        // var mostMassiveId = retValue.id;
        // that.viewerComponent.viewer.select(mostMassiveId);
        // that.viewerComponent.viewer.fitToView([mostMassiveId]);
        // console.log('Most massive part is', mostMassiveId, 'with Mass:', retValue.mass);
      });
    }

    else if (this.group === 3) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb().executeUserFunction(`function userFunction(pdb) {

      // Momentan vier Parameter
      var returnArr = new Array();
      returnArr[0] = new Array();
      returnArr[1] = new Array();
      returnArr[2] = new Array();
      returnArr[3] = new Array();

      var i = 0;

      pdb.enumObjects(dbId => {
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
        that.panel = new Autodesk.Viewing.UI.DockingPanel(container, 'parameterLegend', 'Parameter Legend: Group ' + that.group, { localizeTitle: true, addFooter: true });
        that.panel.setVisible(true);
        that.panel.content = document.createElement('div');
        const contentDiv = that.panel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.style.boxSizing = 'border-box';
        $(that.panel.content).append(html);
        contentDiv.style.overflowY = 'none';
        contentDiv.style.height = 'calc(100% - 90px)';
        contentDiv.style.color = 'black';
        that.panel.container.classList.add('docking-panel-container-solid-color-a');
        that.panel.container.style.height = '250px';
        that.panel.container.style.width = '1000px';
        that.panel.container.style.minWidth = '1000px';
        that.panel.container.style.resize = 'none';

        that.panel.container.appendChild(that.panel.content as HTMLElement);

        // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
        // let tempViewerComponent = that.viewerComponent;
        $(that.panel.container).find('.docking-panel-close').click((e) => {
          that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
          that.buttonMain.setState(1);
          $('#vertical-toolbar-button').attr('style', 'color: #FFFFFF !important ; background-color: #000080');
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
          column1row1.innerHTML = '<div class="box" style="text-align:center">' + 'Flexibility Rating' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column1row1 as HTMLElement);

          const boxColumn1 = column1row1.children[0];
          // Event Listeners
          boxColumn1.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxColumn1.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxColumn1.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
            retValue[0].forEach(obj => {
              let color;
              if (obj.attrIdParameter_flexibility_rating === 0) {
                color = colorRed1;
              }
              else if (obj.attrIdParameter_flexibility_rating === 1) {
                color = colorRed2;
              }
              else if (obj.attrIdParameter_flexibility_rating === 2) {
                color = colorRed3;
              }
              else if (obj.attrIdParameter_flexibility_rating === 3) {
                color = colorRed4;
              }
              else if (obj.attrIdParameter_flexibility_rating === 4) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_flexibility_rating === 5) {
                color = colorGreen4;
              }
              else if (obj.attrIdParameter_flexibility_rating === 6) {
                color = colorGreen3;
              }
              else if (obj.attrIdParameter_flexibility_rating === 7) {
                color = colorGreen2;
              }
              else if (obj.attrIdParameter_flexibility_rating === 8) {
                color = colorGreen1;
              }

              if (that.viewerComponent.viewer.model.getInstanceTree().getChildCount(obj.dbId) !== 0) {
                that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
              }
            });
          });

          const column1row2 = document.createElement('div');
          column1row2.setAttribute('class', 'p-col-1');
          column1row2.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(237, 41, 56) + ';text-align:center">' + '0' + '</div>';
          column1row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row2 as HTMLElement);

          const column1row3 = document.createElement('div');
          column1row3.setAttribute('class', 'p-col-1');
          column1row3.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(213, 70, 20) + ';text-align:center">' + '1' + '</div>';
          column1row3.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row3 as HTMLElement);

          const column1row4 = document.createElement('div');
          column1row4.setAttribute('class', 'p-col-1');
          column1row4.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(185, 88, 0) + ';text-align:center">' + '2' + '</div>';
          column1row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row4 as HTMLElement);

          const column1row5 = document.createElement('div');
          column1row5.setAttribute('class', 'p-col-1');
          column1row5.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(155, 100, 0) + ';text-align:center">' + '3' + '</div>';
          column1row5.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row5 as HTMLElement);

          const column1row6 = document.createElement('div');
          column1row6.setAttribute('class', 'p-col-1');
          column1row6.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(126, 107, 0) + ';text-align:center">' + '4' + '</div>';
          column1row6.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row6 as HTMLElement);

          const column1row7 = document.createElement('div');
          column1row7.setAttribute('class', 'p-col-1');
          column1row7.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(98, 110, 0) + ';text-align:center">' + '5' + '</div>';
          column1row7.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row7 as HTMLElement);

          const column1row8 = document.createElement('div');
          column1row8.setAttribute('class', 'p-col-1');
          column1row8.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(71, 111, 17) + ';text-align:center">' + '6' + '</div>';
          column1row8.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row8 as HTMLElement);

          const column1row9 = document.createElement('div');
          column1row9.setAttribute('class', 'p-col-1');
          column1row9.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(43, 110, 42) + ';text-align:center">' + '7' + '</div>';
          column1row9.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row9 as HTMLElement);

          const column1row10 = document.createElement('div');
          column1row10.setAttribute('class', 'p-col-1');
          column1row10.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(0, 107, 62) + ';text-align:center">' + '8' + '</div>';
          column1row10.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column1row10 as HTMLElement);

        }
        ////////////////////////  Environmental Impact  ////////////////////////
        {
          const column2row1 = document.createElement('div');
          column2row1.setAttribute('class', 'p-col-3');
          column2row1.innerHTML = '<div class="box" style="text-align:center">' + 'Environmental Impact' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column2row1 as HTMLElement);

          const boxcolumn2 = column2row1.children[0];
          // Event Listeners
          boxcolumn2.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxcolumn2.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxcolumn2.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
            retValue[1].forEach(obj => {
              let color;
              if (obj.attrIdParameter_environmental_impact > 400) {
                color = colorRed1;
              }
              else if (obj.attrIdParameter_environmental_impact <= 399 && obj.attrIdParameter_environmental_impact >= 350) {
                color = colorRed2;
              }
              else if (obj.attrIdParameter_environmental_impact <= 349 && obj.attrIdParameter_environmental_impact >= 300) {
                color = colorRed3;
              }
              else if (obj.attrIdParameter_environmental_impact <= 299 && obj.attrIdParameter_environmental_impact >= 250) {
                color = colorRed4;
              }
              else if (obj.attrIdParameter_environmental_impact <= 249 && obj.attrIdParameter_environmental_impact >= 200) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_environmental_impact <= 199 && obj.attrIdParameter_environmental_impact >= 150) {
                color = colorGreen4;
              }
              else if (obj.attrIdParameter_environmental_impact <= 149 && obj.attrIdParameter_environmental_impact >= 150) {
                color = colorGreen3;
              }
              else if (obj.attrIdParameter_environmental_impact <= 99 && obj.attrIdParameter_environmental_impact >= 50) {
                color = colorGreen2;
              }
              else if (obj.attrIdParameter_environmental_impact <= 49 && obj.attrIdParameter_environmental_impact >= 0) {
                color = colorGreen1;
              }

              if (that.viewerComponent.viewer.model.getInstanceTree().getChildCount(obj.dbId) !== 0) {
                that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
              }
            });
          });

          const column2row2 = document.createElement('div');
          column2row2.setAttribute('class', 'p-col-1');
          column2row2.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(237, 41, 56) + ';text-align:center">' + '> 400' + '</div>';
          column2row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row2 as HTMLElement);

          const column2row3 = document.createElement('div');
          column2row3.setAttribute('class', 'p-col-1');
          column2row3.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(213, 70, 20) + ';text-align:center">' + '350 - 399' + '</div>';
          column2row3.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row3 as HTMLElement);

          const column2row4 = document.createElement('div');
          column2row4.setAttribute('class', 'p-col-1');
          column2row4.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(185, 88, 0) + ';text-align:center">' + '300 - 349' + '</div>';
          column2row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row4 as HTMLElement);

          const column2row5 = document.createElement('div');
          column2row5.setAttribute('class', 'p-col-1');
          column2row5.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(155, 100, 0) + ';text-align:center">' + '250 - 299' + '</div>';
          column2row5.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row5 as HTMLElement);

          const column2row6 = document.createElement('div');
          column2row6.setAttribute('class', 'p-col-1');
          column2row6.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(126, 107, 0) + ';text-align:center">' + '200 - 249' + '</div>';
          column2row6.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row6 as HTMLElement);

          const column2row7 = document.createElement('div');
          column2row7.setAttribute('class', 'p-col-1');
          column2row7.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(98, 110, 0) + ';text-align:center">' + '150 - 199' + '</div>';
          column2row7.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row7 as HTMLElement);

          const column2row8 = document.createElement('div');
          column2row8.setAttribute('class', 'p-col-1');
          column2row8.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(71, 111, 17) + ';text-align:center">' + '100 - 149' + '</div>';
          column2row8.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row8 as HTMLElement);

          const column2row9 = document.createElement('div');
          column2row9.setAttribute('class', 'p-col-1');
          column2row9.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(43, 110, 42) + ';text-align:center">' + '50 - 99' + '</div>';
          column2row9.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row9 as HTMLElement);

          const column2row10 = document.createElement('div');
          column2row10.setAttribute('class', 'p-col-1');
          column2row10.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(0, 107, 62) + ';text-align:center">' + '0 - 49' + '</div>';
          column2row10.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column2row10 as HTMLElement);
        }
        ////////////////////////  Circularity  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML = '<div class="box" style="text-align:center">' + 'Circularity' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column3row1 as HTMLElement);

          const boxcolumn3 = column3row1.children[0];
          // Event Listeners
          boxcolumn3.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxcolumn3.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxcolumn3.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
            retValue[2].forEach(obj => {
              let color;
              if (obj.attrIdParameter_circularity <= 19 && obj.attrIdParameter_circularity >= 0) {
                color = colorRed1;
              }
              else if (obj.attrIdParameter_circularity <= 29 && obj.attrIdParameter_circularity >= 20) {
                color = colorRed2;
              }
              else if (obj.attrIdParameter_circularity <= 39 && obj.attrIdParameter_circularity >= 30) {
                color = colorRed3;
              }
              else if (obj.attrIdParameter_circularity <= 49 && obj.attrIdParameter_circularity >= 40) {
                color = colorRed4;
              }
              else if (obj.attrIdParameter_circularity <= 59 && obj.attrIdParameter_circularity >= 50) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_circularity <= 69 && obj.attrIdParameter_circularity >= 60) {
                color = colorGreen4;
              }
              else if (obj.attrIdParameter_circularity <= 79 && obj.attrIdParameter_circularity >= 70) {
                color = colorGreen3;
              }
              else if (obj.attrIdParameter_circularity <= 89 && obj.attrIdParameter_circularity >= 80) {
                color = colorGreen2;
              }
              else if (obj.attrIdParameter_circularity >= 90) {
                color = colorGreen1;
              }

              if (that.viewerComponent.viewer.model.getInstanceTree().getChildCount(obj.dbId) !== 0) {
                that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
              }
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-1');
          column3row2.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(237, 41, 56) + ';text-align:center">' + '0 - 19' + '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-1');
          column3row3.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(213, 70, 20) + ';text-align:center">' + '20 - 29' + '</div>';
          column3row3.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-1');
          column3row4.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(185, 88, 0) + ';text-align:center">' + '30 - 39' + '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row4 as HTMLElement);

          const column3row5 = document.createElement('div');
          column3row5.setAttribute('class', 'p-col-1');
          column3row5.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(155, 100, 0) + ';text-align:center">' + '40 - 49' + '</div>';
          column3row5.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row5 as HTMLElement);

          const column3row6 = document.createElement('div');
          column3row6.setAttribute('class', 'p-col-1');
          column3row6.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(126, 107, 0) + ';text-align:center">' + '50 - 59' + '</div>';
          column3row6.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row6 as HTMLElement);

          const column3row7 = document.createElement('div');
          column3row7.setAttribute('class', 'p-col-1');
          column3row7.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(98, 110, 0) + ';text-align:center">' + '60 - 69' + '</div>';
          column3row7.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row7 as HTMLElement);

          const column3row8 = document.createElement('div');
          column3row8.setAttribute('class', 'p-col-1');
          column3row8.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(71, 111, 17) + ';text-align:center">' + '70 - 79' + '</div>';
          column3row8.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row8 as HTMLElement);

          const column3row9 = document.createElement('div');
          column3row9.setAttribute('class', 'p-col-1');
          column3row9.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(43, 110, 42) + ';text-align:center">' + '80 - 89' + '</div>';
          column3row9.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row9 as HTMLElement);

          const column3row10 = document.createElement('div');
          column3row10.setAttribute('class', 'p-col-1');
          column3row10.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(0, 107, 62) + ';text-align:center">' + '> 90' + '</div>';
          column3row10.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row10 as HTMLElement);
        }
        //////////////////////////  Lifespan  ////////////////////////
        {
          const column3row1 = document.createElement('div');
          column3row1.setAttribute('class', 'p-col-3');
          column3row1.innerHTML = '<div class="box" style="text-align:center">' + 'Lifespan' + '</div>';
          $(that.panel.container).find('#legend')[0].appendChild(column3row1 as HTMLElement);

          const boxcolumn3 = column3row1.children[0];
          // Event Listeners
          boxcolumn3.addEventListener('mouseover', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = '#000080';
            targetElement.style.color = 'white';
          }, false);
          boxcolumn3.addEventListener('mouseout', (event) => {
            const targetElement = event.target as HTMLElement;
            targetElement.style.backgroundColor = 'transparent';
            targetElement.style.color = 'black';
          }, false);
          boxcolumn3.addEventListener('click', async (event) => {
            that.viewerComponent.viewer.clearThemingColors(that.viewerComponent.viewer.model);
            retValue[3].forEach(obj => {
              let color;
              if (obj.attrIdParameter_lifespan <= 4 && obj.attrIdParameter_lifespan >= 0) {
                color = colorRed1;
              }
              else if (obj.attrIdParameter_lifespan <= 5 && obj.attrIdParameter_lifespan >= 9) {
                color = colorRed2;
              }
              else if (obj.attrIdParameter_lifespan <= 19 && obj.attrIdParameter_lifespan >= 10) {
                color = colorRed3;
              }
              else if (obj.attrIdParameter_lifespan <= 29 && obj.attrIdParameter_lifespan >= 20) {
                color = colorRed4;
              }
              else if (obj.attrIdParameter_lifespan <= 39 && obj.attrIdParameter_lifespan >= 30) {
                color = colorYellow;
              }
              else if (obj.attrIdParameter_lifespan <= 49 && obj.attrIdParameter_lifespan >= 40) {
                color = colorGreen4;
              }
              else if (obj.attrIdParameter_lifespan <= 59 && obj.attrIdParameter_lifespan >= 50) {
                color = colorGreen3;
              }
              else if (obj.attrIdParameter_lifespan <= 69 && obj.attrIdParameter_lifespan >= 60) {
                color = colorGreen2;
              }
              else if (obj.attrIdParameter_lifespan >= 70) {
                color = colorGreen1;
              }

              if (that.viewerComponent.viewer.model.getInstanceTree().getChildCount(obj.dbId) !== 0) {
                that.viewerComponent.viewer.setThemingColor(obj.dbId, color, that.viewerComponent.viewer.model, true);
              }
            });
          });

          const column3row2 = document.createElement('div');
          column3row2.setAttribute('class', 'p-col-1');
          column3row2.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(237, 41, 56) + ';text-align:center">' + '0 - 4' + '</div>';
          column3row2.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row2 as HTMLElement);

          const column3row3 = document.createElement('div');
          column3row3.setAttribute('class', 'p-col-1');
          column3row3.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(213, 70, 20) + ';text-align:center">' + '5 - 9' + '</div>';
          column3row3.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row3 as HTMLElement);

          const column3row4 = document.createElement('div');
          column3row4.setAttribute('class', 'p-col-1');
          column3row4.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(185, 88, 0) + ';text-align:center">' + '10 - 19' + '</div>';
          column3row4.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row4 as HTMLElement);

          const column3row5 = document.createElement('div');
          column3row5.setAttribute('class', 'p-col-1');
          column3row5.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(155, 100, 0) + ';text-align:center">' + '20 - 29' + '</div>';
          column3row5.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row5 as HTMLElement);

          const column3row6 = document.createElement('div');
          column3row6.setAttribute('class', 'p-col-1');
          column3row6.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(126, 107, 0) + ';text-align:center">' + '30 - 39' + '</div>';
          column3row6.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row6 as HTMLElement);

          const column3row7 = document.createElement('div');
          column3row7.setAttribute('class', 'p-col-1');
          column3row7.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(98, 110, 0) + ';text-align:center">' + '40 - 49' + '</div>';
          column3row7.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row7 as HTMLElement);

          const column3row8 = document.createElement('div');
          column3row8.setAttribute('class', 'p-col-1');
          column3row8.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(71, 111, 17) + ';text-align:center">' + '50 - 59' + '</div>';
          column3row8.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row8 as HTMLElement);

          const column3row9 = document.createElement('div');
          column3row9.setAttribute('class', 'p-col-1');
          column3row9.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(43, 110, 42) + ';text-align:center">' + '60 - 69' + '</div>';
          column3row9.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row9 as HTMLElement);

          const column3row10 = document.createElement('div');
          column3row10.setAttribute('class', 'p-col-1');
          column3row10.innerHTML = '<div class="box" style="background-color:' + that.fullColorHex(0, 107, 62) + ';text-align:center">' + '> 70' + '</div>';
          column3row10.style.color = 'white';
          $(that.panel.container).find('#legend')[0].appendChild(column3row10 as HTMLElement);
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
    console.log(this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]));

    console.log('child');
    console.log(this.viewerComponent.viewer.model.getInstanceTree().getChildCount(dbIdArray[0]));


    // //@ts-ignore
    // var nodeFinalName = this.instanceTree.getNodeName(dbIdArray[0]);

    // console.log(nodeFinalName);
    // console.log(this.instanceTree);

    // @ts-ignore
    this.viewerComponent.viewer.model.getProperties(
      dbIdArray[0],
      res => {
        console.log('Properties');
        console.log(res);
      },
      err => {
        console.log(err);
      },
    );

    // setThemingColor(dbId, color, model, recursive)
    // const color = new THREE.Vector4(256 / 256, 0 / 256, 0 / 256, 1);
    // this.viewerComponent.viewer.setThemingColor(dbIdArray[0], color, this.viewerComponent.viewer.model);

    // var parent = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]);
  }
}

