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
        // this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'Bucket was deleted correctly!!', life: 10000 });

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

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: model2group1.rvt
    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDJncm91cDEucnZ0';
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

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: model4group3.rvt
    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDRncm91cDMucnZ0';

  }

  public loadVerticalToolbar() {
    // Button 1
    const buttonMain = new Autodesk.Viewing.UI.Button('vertical-toolbar-button');
    buttonMain.addClass('vertical-toolbar-button');
    // @ts-ignore
    buttonMain.container.children[0].classList.add('fas', 'fa-question');
    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup('vertical-toolbar-controlGroup');
    controlGroup.addControl(buttonMain);
    // Toolbar
    const toolbarFacade = new Autodesk.Viewing.UI.ToolBar('vertical-toolbar', { collapsible: false, alignVertically: true });
    buttonMain.onClick = (event) => {
      if (buttonMain.getState() === 1) {
        $('#vertical-toolbar-button').attr('style', 'color: #000000 !important ; background-color: #FFFFFF');
        buttonMain.setState(0);
        // this.selectedFacadeEnabled = true;
        // this.messageService.add({ key: 'warning', severity: 'success', summary: 'New', detail: 'Here we can add some functionalities' });
        this.coloringModel();
        // this.showValuesOfParameter('facade');
        var valuesOfParameter: any[];
        // this.api.getvaluesOfParameter('facade', this.platform.currentProject._id).then(
        //   res => {
        //     if (res === null) {
        //       this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
        //     }
        //     else {
        //       valuesOfParameter = res;
        //       // console.log('valuesOfParameter');
        //       // console.log(valuesOfParameter);
        //       valuesOfParameter.forEach(valueOfParameter => {
        //         if (!valueOfParameter) {
        //           valueOfParameter = 'null';
        //         }
        //         // Es werden alle Whitespaces gelöscht
        //         valueOfParameter = valueOfParameter.replace(/ /g, '');

        //         // Braucht einen Anhang an jede Klasse, da CSS Klasse nicht mit [0-9] beginnen kann
        //         var annexClass = 'Class_';

        //         // iterative Button
        //         var buttonIterativ = new Autodesk.Viewing.UI.Button(annexClass + valueOfParameter);

        //         // Click Event !! Important !!
        //         buttonIterativ.onClick = () => {
        //           // if (buttonIterativ.getState() === 1) {
        //           //   $('#' + annexClass + valueOfParameter).css('background-color', '#FE3123');
        //           //   buttonIterativ.setState(0);
        //           //   this.valueOfParameterFacadeArray.push({
        //           //     [valueOfParameter]: this.inputs.filter(element => {
        //           //       return element.facade === valueOfParameter;
        //           //     })
        //           //   }
        //           //   );
        //           // }
        //           // else {
        //           //   buttonIterativ.setState(1);
        //           //   this.viewerComponent.viewer.unloadExtension('IconMarkupExtension');
        //           //   $('#' + annexClass + valueOfParameter).css('background-color', '#A80000');
        //           //   this.valueOfParameterFacadeArray.forEach((element, index) => {
        //           //     if (Object.keys(element)[0] === valueOfParameter) {
        //           //       this.valueOfParameterFacadeArray.splice(index, 1);
        //           //     }
        //           //   });
        //           // }
        //         };

        //         buttonIterativ.addClass(annexClass + valueOfParameter);
        //         controlGroup.addControl(buttonIterativ);
        //         // tslint:disable-next-line: max-line-length
        //         $('#' + annexClass + valueOfParameter).append('<style>.' + annexClass + valueOfParameter + ':before{content: attr(data-before); font-size: 20px; color: white;}</style>');
        //         $('#' + annexClass + valueOfParameter).append('<style>.' + annexClass + valueOfParameter + '{width: 38px !important}</style>');
        //         $('#' + annexClass + valueOfParameter).append('<style>.' + annexClass + valueOfParameter + '{animation: slideMe .7s ease-in;}</style>');
        //         $('#' + annexClass + valueOfParameter.toString()).attr('data-before', valueOfParameter);
        //       });
        //     }
        //   }
        // );
      }
      else {
        buttonMain.setState(1);
        // this.selectedFacadeEnabled = false;
        $('#vertical-toolbar-button').attr('style', 'color: #FFFFFF !important ; background-color: #000080');
        // this.panel.setVisible(false);
        this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
        this.messageService.add({ key: 'warning', severity: 'success', summary: 'New', detail: 'Here we can add some functionalities' });

        while (controlGroup.getNumberOfControls() > 1) {
          var tempID = controlGroup.getControlId(1);
          controlGroup.removeControl(tempID);
        }
        this.viewerComponent.viewer.unloadExtension('IconMarkupExtension');
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
        if (name === 'geographical_origin') {
          attrIdParameter_geographical_origin = i;
          console.log(name);
          // return true; // to stop iterating over the remaining attributes.
        }
        else if (name === 'life_cycle_origin') {
          attrIdParameter_life_cycle_origin = i;
        }
        else if (name === 'flexibility_rating') {
          attrIdParameter_flexibility_rating = i;
        }
        else if (name === 'end_of_life_potential') {
          attrIdParameter_end_of_life_potential = i;
        }
      });

      // Early return is the model doesn't contain data for "Mass".
      // if (attrIdParameter === -1) {
      //   return null;
      // }

      var returnArr = new Array();

      pdb.enumObjects(dbId => {

        // For each part, iterate over their properties.
        pdb.enumObjectProperties(dbId, (attrId, valId) => {

          if (attrId === attrIdParameter_geographical_origin) {
            var value = pdb.getAttrValue(attrId, valId);
            return true;
          }
          else if (attrId === attrIdParameter_life_cycle_origin) {
            var value = pdb.getAttrValue(attrId, valId);
            return true;
          }
          else if (attrId === attrIdParameter_flexibility_rating) {
            var value = pdb.getAttrValue(attrId, valId);
            return true;
          }
          else if (attrId === attrIdParameter_end_of_life_potential) {
            var value = pdb.getAttrValue(attrId, valId);
            return true;
          }
        });
      });
      return returnArr;
  }`);
      const that = this;
      promise.then(function (retValue) {

        console.log(retValue);

        // if (!retValue) {
        //   this.messageService.add({ key: 'warning', sticky: true, severity: 'error', summary: 'Coloring', detail: 'Model doesn\'t contain property \'Flexibility_Rating\'.' });
        //   return;
        // }

        // console.log(retValue);

        // const colorRed = new THREE.Vector4(237 / 256, 41 / 256, 56 / 256, 1);
        // const colorOrange = new THREE.Vector4(255 / 256, 140 / 256, 1 / 256, 1);
        // const colorYellow = new THREE.Vector4(255 / 256, 231 / 256, 51 / 256, 1);
        // const colorGreen = new THREE.Vector4(0 / 256, 132 / 256, 80 / 256, 1);

        // const instanceTree = that.instanceTree;
        // const rootNodeId = instanceTree.getRootId();
        // that.viewerComponent.viewer.setThemingColor(rootNodeId, colorRed, that.viewerComponent.viewer.model, true);

        // // const traverseRecursively = true;
        // // function callback(dbid) {
        // //   console.log('Found object ID', dbid);
        // // }
        // // instanceTree.enumNodeChildren(rootNodeId, callback, traverseRecursively);

        // retValue[0].forEach(dbid => {
        //   if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
        //     that.viewerComponent.viewer.setThemingColor(dbid + 2, colorRed, that.viewerComponent.viewer.model, true);
        //   }
        //   else {
        //     that.viewerComponent.viewer.setThemingColor(dbid, colorRed, that.viewerComponent.viewer.model, true);
        //   }
        // });
        // retValue[1].forEach(dbid => {
        //   if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
        //     that.viewerComponent.viewer.setThemingColor(dbid + 2, colorOrange, that.viewerComponent.viewer.model, true);
        //   }
        //   else {
        //     that.viewerComponent.viewer.setThemingColor(dbid, colorOrange, that.viewerComponent.viewer.model, true);
        //   }
        // });
        // retValue[2].forEach(dbid => {
        //   if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
        //     that.viewerComponent.viewer.setThemingColor(dbid + 2, colorYellow, that.viewerComponent.viewer.model, true);
        //   }
        //   else {
        //     that.viewerComponent.viewer.setThemingColor(dbid, colorYellow, that.viewerComponent.viewer.model, true);
        //   }
        // });
        // retValue[3].forEach(dbid => {
        //   if (!that.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbid)) {
        //     that.viewerComponent.viewer.setThemingColor(dbid + 2, colorGreen, that.viewerComponent.viewer.model, true);
        //   }
        //   else {
        //     that.viewerComponent.viewer.setThemingColor(dbid, colorGreen, that.viewerComponent.viewer.model, true);
        //   }
        // });
        // // var mostMassiveId = retValue.id;
        // // that.viewerComponent.viewer.select(mostMassiveId);
        // // that.viewerComponent.viewer.fitToView([mostMassiveId]);
        // // console.log('Most massive part is', mostMassiveId, 'with Mass:', retValue.mass);
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

    // //@ts-ignore
    // this.viewerComponent.viewer.model.getProperties(
    //   dbIdArray[0],
    //   res => {
    //     console.log(res);
    //   },
    //   err => {
    //     console.log(err);
    //   },
    // );

    // setThemingColor(dbId, color, model, recursive)
    // const color = new THREE.Vector4(256 / 256, 0 / 256, 0 / 256, 1);
    // this.viewerComponent.viewer.setThemingColor(dbIdArray[0], color, this.viewerComponent.viewer.model);

    // var parent = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]);
  }
}

