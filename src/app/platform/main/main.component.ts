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

  // Für ng build github
  public message: any;

  // Model stuff
  leafcomponents = [];

  public instanceTree: Autodesk.Viewing.InstanceTree;


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
        // $('canvas').hide();
        this.replaceSpinner();
        $('.lds-roller').show();
        this.viewerComponent.viewer.setGhosting(false);
        // $('canvas').show();
        $('.lds-roller').hide();

        this.app.openOverlay();
        this.messageService.add({ key: 'chooseGroup', sticky: true, severity: 'warn', summary: 'GROUP', detail: 'Choose your group' });
        // this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'Bucket was deleted correctly!!', life: 10000 });

        const objectTreeCreated = () => {

          console.log('objectTreeCreated');

          // Instantiation of model stuff
          this.instanceTree = this.viewerComponent.viewer.model.getData().instanceTree;
        };

        this.viewerComponent.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, objectTreeCreated);


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
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: "You're seeing the model of Group 1", life: 5000 });

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: model1group1.rvt
    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDFncm91cDEucnZ0';
  }

  choosedGroup2() {
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: "You're seeing the model of Group 2", life: 5000 });

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: model1group2.rvt
    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS9tb2RlbDFncm91cDIucnZ0';
  }

  choosedGroup3() {
    this.closeGroupToast();
    // tslint:disable-next-line: quotemark
    this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: "You're seeing the model of Group 3", life: 5000 });

    // ossBucketKey: interdisciplinary_class_fs21                  ossSourceFileObjectKey: testforge.rvt
    this.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6aW50ZXJkaXNjaXBsaW5hcnlfY2xhc3NfZnMyMS90ZXN0Zm9yZ2UucnZ0';
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
        this.messageService.add({ key: 'warning', severity: 'success', summary: 'New', detail: 'Here we can add some functionalities' });

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

  public async selectionChanged(event: SelectionChangedEventArgs) {
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;

    console.log('dbIdArray');
    console.log(dbIdArray);
    // this.viewerComponent.viewer.model.getProperties(dbIdArray[0], (data) =>
    //   console.log(data)
    // );

    //@ts-ignore
    var nodeFinalName = this.instanceTree.getNodeName(dbIdArray[0]);

    console.log(nodeFinalName);
    console.log(this.instanceTree);

    //@ts-ignore
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
    const color = new THREE.Vector4(256 / 256, 0 / 256, 0 / 256, 1);
    this.viewerComponent.viewer.setThemingColor(dbIdArray[0], color, this.viewerComponent.viewer.model);

    // var parent = this.viewerComponent.viewer.model.getInstanceTree().getNodeParentId(dbIdArray[0]);
  }
}

