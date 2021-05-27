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

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: model4group1.rvt

    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDEucnZ0';
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

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: model5group3.rvt
    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDVncm91cDMucnZ0';

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
        this.coloringModel();
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
    if (this.group === 1) {
      // @ts-ignore
      var promise = this.viewerComponent.viewer.model.getPropertyDb().executeUserFunction(`function userFunction(pdb) {
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

      pdb.enumObjects(dbId => {

        // For each part, iterate over their properties.
        pdb.enumObjectProperties(dbId, (attrId, valId) => {

          if (attrId === attrIdParameter_geographical_origin) {
            var value = pdb.getAttrValue(attrId, valId);
            var object = {dbId: dbId, attrIdParameter_geographical_origin: parseInt(value)};
            returnArr[0].push(object);
          }
          else if (attrId === attrIdParameter_life_cycle_origin) {
            var value = pdb.getAttrValue(attrId, valId);
            var object = {dbId: dbId, attrIdParameter_life_cycle_origin: parseInt(value)};
            returnArr[1].push(object);
          }
          else if (attrId === attrIdParameter_flexibility_rating) {
            var value = pdb.getAttrValue(attrId, valId);
            var object = {dbId: dbId, attrIdParameter_flexibility_rating: parseInt(value)};
            returnArr[2].push(object);
          }
          else if (attrId === attrIdParameter_end_of_life_potential) {
            var value = pdb.getAttrValue(attrId, valId);
            var object = {dbId: dbId, attrIdParameter_end_of_life_potential: parseInt(value)};
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
        that.panel = new Autodesk.Viewing.UI.DockingPanel(container, 'parameterLegend', 'Parameter Legend: ' + that.group, { localizeTitle: true, addFooter: true });
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
        var value = pdb.getAttrValue(attrId, valId);
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
  }

  public async selectionChanged(event: SelectionChangedEventArgs) {
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;

    console.log('dbIdArray');
    console.log(dbIdArray);

    // console.log('parent');
    // console.log(this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]));

    // console.log('child');
    // console.log(this.viewerComponent.viewer.model.getInstanceTree().getChildCount(dbIdArray[0]));


    // //@ts-ignore
    // var nodeFinalName = this.instanceTree.getNodeName(dbIdArray[0]);

    // console.log(nodeFinalName);
    // console.log(this.instanceTree);

    // @ts-ignore
    this.viewerComponent.viewer.model.getProperties(
      dbIdArray[0],
      res => {
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

