import { Component, OnInit, Input, ViewChild } from '@angular/core';
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

import * as $ from 'jquery';
declare var THREE: any;

import html from './legendTemplate.html';

// Function for async forEach
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

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
  public toolbarTest: Autodesk.Viewing.UI.ToolBar;

  public isolatedNodesConcrete: number[] = new Array();
  public isolatedNodesLevels: number[] = new Array();

  // Model stuff
  public objectsPerLevel: any[] = new Array();
  public concrObj: any[] = new Array();
  public walls: Wall[] = new Array();
  public slabs: Slab[] = new Array();
  public columns: Column[] = new Array();
  public foundations: Foundation[] = new Array();
  leafcomponents = [];

  public panel: Autodesk.Viewing.UI.DockingPanel;

  @ViewChild(ViewerComponent, { static: false })
  viewerComponent: ViewerComponent;

  constructor(private api: ApiService) {
    this.api.getspecificProject('5faa62b2079c07001454c421').then((res) => {
      this.encodedmodelurn = res.encodedmodelurn;
    });
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

          // CoordinatesAxesExtension.extensionName,
        ],
        //,'GetPositionExtension'], //[IconMarkupExtension.extensionName], // [GetParameterExtension.extensionName],
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
        this.loadTestToolbar();
        this.loadWDToolbar();
        this.viewerComponent.viewer.setGhosting(false);

        // Graphische Anpassung
        // $('#forge-viewer').hide();
      },
      // Muss true sein
      showFirstViewable: true,
      // Ist falsch gesetzt => GuiViewer3D => Buttons ausgeblendet in Viewer CSS
      headlessViewer: false,
    };
  }

  ngOnInit(): void {}

  public async scriptsLoaded() {
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
          var annexClass = 'Class_';

          // iterative Button
          var buttonIterativ = new Autodesk.Viewing.UI.Button(
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
          var tempID = controlGroup.getControlId(1);
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
    //Button Concrete
    const button1 = new Autodesk.Viewing.UI.Button('showing-concrete');
    button1.addClass('showing-concrete');
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
          var annexClass = 'Class_';

          // iterative Button
          var buttonIterativ = new Autodesk.Viewing.UI.Button(
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
          var tempID = controlGroup.getControlId(1);
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

  public loadTestToolbar() {
    //button test
    const button1 = new Autodesk.Viewing.UI.Button('showing-testing');
    button1.addClass('showing-testing');
    //@ts-ignore
    button1.container.children[0].classList.add('far', 'fa-question-circle');
    // button1.setIcon('far fa-question-circle');
    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup(
      'my-custom-toolbar-test-controlgroup'
    );
    controlGroup.addControl(button1);
    // Toolbar
    // this.toolbarTest = new Autodesk.Viewing.UI.ToolBar(
    //   'my-custom-view-toolbar-test',
    //   { collapsible: false, alignVertically: false }
    // );

    button1.onClick = (event) => {
      if (button1.getState() === 1) {
        button1.setState(0);
        //Test functions
        console.log('Test started');

        this.showPropLegend();

        //////////TESTING ZONES ///////////////////////
        //get current selection
        const selection = this.viewerComponent.viewer.getSelection();
        this.viewerComponent.viewer.clearSelection();
        if (selection.length > 0) {
          let zones = [];
          // console.log(selection);
          selection.forEach((dbId) => {
            // console.log(props);
            zones.push(dbId);
            const color = new THREE.Vector4(0 / 256, 128 / 256, 0 / 256, 1);
            this.viewerComponent.viewer.setThemingColor(
              dbId,
              color,
              this.viewerComponent.viewer.model,
              true
            );
          });
          console.log(zones);
        }

        // this.defineAllProp(this.slabs);
        // this.defineAllProp(this.walls);
        // this.defineAllProp(this.columns);
        // this.defineAllProp(this.foundations);

        // this.workDensityColorMap();
        // console.log(this.walls);
        // this.defineAllProp(this.walls);
        // test coloring for slabs based on  WD formwork
        // this.colorWdObjects(this.walls, 'WDwF');
        // this.colorWdObjects(this.columns, 'WDcF');
        // this.colorWdObjects(this.slabs, 'WDsF');
        // this.colorWdObjects(this.foundations, 'WDfF');
        // this.setupUI();
      } else {
        button1.setState(1);

        while (controlGroup.getNumberOfControls() > 1) {
          var tempID = controlGroup.getControlId(1);
          controlGroup.removeControl(tempID);
        }
      }
    };
    // There we have to wait since the toolbar is not loaded
    setTimeout(() => {
      this.viewerComponent.viewer.toolbar.addControl(controlGroup);
    }, 5000);
    $('#guiviewer3d-toolbar').append(controlGroup.container);
  }
  //////TESTING THREEJS////////////

  ///////////////////////////////////////////////////////////

  public loadWDToolbar() {
    //button test
    const button1 = new Autodesk.Viewing.UI.Button('showing-WDformwork');
    button1.addClass('showing-WDformwork');
    //@ts-ignore
    button1.container.children[0].classList.add('fab', 'fa-facebook-f');
    // button1.setIcon('far fa-question-circle');
    // SubToolbar
    const button2 = new Autodesk.Viewing.UI.Button('showing-WDreinforcement');

    button2.addClass('showing-WDreinforcement');
    //@ts-ignore
    button2.container.children[0].classList.add('far', 'fa-registered');
    const button3 = new Autodesk.Viewing.UI.Button('showing-WDconcrete');

    button3.addClass('showing-WDconcrete');
    //@ts-ignore
    button3.container.children[0].classList.add('fas', 'fa-truck-pickup');
    const button4 = new Autodesk.Viewing.UI.Button('showing-WDcuring');

    button4.addClass('showing-WDcuring');
    //@ts-ignore
    button4.container.children[0].classList.add('fab', 'fa-cuttlefish');
    const button5 = new Autodesk.Viewing.UI.Button('showing-WDstrip');

    button5.addClass('showing-WDstrip');
    //@ts-ignore
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
        var list = document.getElementById('tempPanel');
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
        var list = document.getElementById('tempPanel');
        document.body.removeChild(list);

        while (controlGroup.getNumberOfControls() > 5) {
          var tempID = controlGroup.getControlId(5);
          controlGroup.removeControl(tempID);
        }
      }
    };
    button2.onClick = (event) => {
      if (button2.getState() === 1) {
        button2.setState(0);
        button1.setState(1);
        button3.setState(1);
        button4.setState(1);
        button5.setState(1);
        var list = document.getElementById('tempPanel');
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
        var list = document.getElementById('tempPanel');
        document.body.removeChild(list);

        while (controlGroup.getNumberOfControls() > 5) {
          var tempID = controlGroup.getControlId(5);
          controlGroup.removeControl(tempID);
        }
      }
    };
    button3.onClick = (event) => {
      if (button3.getState() === 1) {
        button3.setState(0);
        button2.setState(1);
        button1.setState(1);
        button4.setState(1);
        button5.setState(1);
        var list = document.getElementById('tempPanel');
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
        var list = document.getElementById('tempPanel');
        document.body.removeChild(list);

        while (controlGroup.getNumberOfControls() > 5) {
          var tempID = controlGroup.getControlId(5);
          controlGroup.removeControl(tempID);
        }
      }
    };
    button4.onClick = (event) => {
      if (button4.getState() === 1) {
        button4.setState(0);
        button2.setState(1);
        button3.setState(1);
        button1.setState(1);
        button5.setState(1);
        var list = document.getElementById('tempPanel');
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
        var list = document.getElementById('tempPanel');
        document.body.removeChild(list);

        while (controlGroup.getNumberOfControls() > 5) {
          var tempID = controlGroup.getControlId(5);
          controlGroup.removeControl(tempID);
        }
      }
    };
    button5.onClick = (event) => {
      if (button5.getState() === 1) {
        button5.setState(0);
        button2.setState(1);
        button3.setState(1);
        button4.setState(1);
        button1.setState(1);
        var list = document.getElementById('tempPanel');
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
        var list = document.getElementById('tempPanel');
        // console.log(list);
        document.body.removeChild(list);

        while (controlGroup.getNumberOfControls() > 5) {
          var tempID = controlGroup.getControlId(5);
          controlGroup.removeControl(tempID);
        }
      }
    };
    // There we have to wait since the toolbar is not loaded
    setTimeout(() => {
      this.viewerComponent.viewer.toolbar.addControl(controlGroup);
    }, 5000);
    $('#guiviewer3d-toolbar').append(controlGroup.container);
  }
  public async runDifferentFunc() {
    $('.lds-roller').show();
    // SetTimeout only for vizualization purposes
    setTimeout(async () => {
      const allDbIds = this.getAllDbIds();
      await this.storeLevelObjects().then(async () => {
        await this.storeConcreteElements().then(async () => {
          // $('canvas').show();
          // $('.lds-roller').hide();
          await this.storeCategoryObjects().then(async () => {
            // console.log(this.walls);
            // console.log(this.columns);
            // console.log(this.slabs);
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
                  console.log('finished');
                  $('canvas').show();
                  $('.lds-roller').hide();
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
        const concrValues = uniqMat.filter((item) => item.includes('Beton'));
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
      'Category',
      'Material',
    ]).then((res) => {
      // console.log(res);
      if (Array.isArray(res)) {
        let resNew = res.filter((item) => item.properties.length > 1);
        return asyncForEach(resNew, (element) => {
          if (
            element.properties[0].displayValue === 'IMP_Beton' &&
            element.properties[1].displayValue === 'Walls'
          ) {
            const wall = new Wall(
              this.makeid(5),
              element.dbId,
              this.getLeafComponentsRec(element.dbId)
            );
            wall.category = 'Wall';
            this.walls.push(wall);
          } else if (
            element.properties[0].displayValue === 'IMP_Beton' &&
            element.properties[1].displayValue === 'Floors'
          ) {
            const slab = new Slab(
              this.makeid(5),
              element.dbId,
              this.getLeafComponentsRec(element.dbId)
            );
            slab.category = 'Slab';
            this.slabs.push(slab);
          } else if (
            element.properties[0].displayValue === 'IMP_Beton' &&
            element.properties[1].displayValue === 'Structural Columns'
          ) {
            const column = new Column(
              this.makeid(5),
              element.dbId,
              this.getLeafComponentsRec(element.dbId)
            );
            column.category = 'Column';
            this.columns.push(column);
          }
        }).then(async () => {
          return await this.getBulkProperties(allDbIds, [
            'PREDEFINEDTYPE',
            'Material',
          ]).then((res) => {
            if (Array.isArray(res)) {
              let resNew = res.filter((item) => item.properties.length > 1);
              asyncForEach(resNew, (element) => {
                if (
                  element.properties[0].displayValue === 'IMP_Beton' &&
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

  public async getAndSetProperties(categoryitems) {
    return await asyncForEach(categoryitems, async (item) => {
      return await this.getBulkProperties([item.dbId], null).then(
        async (data) => {
          return await asyncForEach(data, async (element) => {
            return await asyncForEach(element.properties, (prop) => {
              if (
                prop.displayName === 'GrossVolume' ||
                prop.displayName === 'Volume'
              ) {
                item.volume = parseFloat(prop.displayValue);
                // console.log(item);
              } else if (
                prop.displayName === 'GrossArea' || // GrossArea is taekn from Quantities
                prop.displayName === 'Area' // Area is taken from Dimensions, but it's the same value
              ) {
                item.area = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'Thickness') {
                item.thickness = parseFloat(prop.displayValue);
              } else if (
                prop.displayName === 'Perimeter' ||
                prop.displayName === 'Umfang' ||
                // not all columns especially prefabricated have property perimeter
                prop.displayName === 'Umfang_Kreis'
              ) {
                item.perimeter = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'GrossSideArea') {
                item.sideArea = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'Width') {
                item.width = parseFloat(prop.displayValue);
              } else if (prop.displayName === 'Height') {
                item.height = parseFloat(prop.displayValue);
              } else if (
                prop.displayName === 'Length' &&
                // There is the same property in the category of dimensions [especially for WALLS] and it's not the same value
                prop.displayCategory === 'Quantities'
              ) {
                item.length = parseFloat(prop.displayValue);
              } else if (
                // There is the same property in the category of dimensions [especially for WALLS] and it's not the same value
                prop.displayName === 'Stützenhöhe'
              ) {
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
          element.prF = 0.12; // values taken from Semester Project
          element.prR = 16;
          element.prC = 0.14;
          element.prS = 0.12;
        });
        break;
      case this.columns:
        this.columns.forEach((element) => {
          element.csF = 3;
          element.csR = 3;
          element.csC = 3;
          element.csS = 3;
          element.prF = 0.12;
          element.prR = 16;
          element.prC = 0.14;
          element.prS = 0.12;
        });
        break;
      case this.slabs:
        this.slabs.forEach((element) => {
          element.csF = 3;
          element.csR = 3;
          element.csC = 3;
          element.csS = 3;
          element.prF = 0.12;
          element.prR = 16;
          element.prC = 0.14;
          element.prS = 0.12;
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
            (2 *
              (element.sideArea + element.width * element.height) *
              element.prF) /
            element.csF;
          element.WDwR = (0.085 * element.volume * element.prR) / element.csR; // ?* 0.17tons/m3
          element.WDwC = (element.volume * element.prC) / element.csC; // ?* tons
          element.WDwCR = 8; // 8hours= 1 day
          element.WDwS =
            (2 *
              (element.sideArea + element.width * element.height) *
              element.prS) /
            element.csS;
        });
        break;
      case this.columns:
        this.columns.forEach((element) => {
          element.WDcF =
            (element.perimeter * element.length * element.prF) / element.csF;
          element.WDcR = (0.15 * element.volume * element.prR) / element.csR;
          element.WDcC = (element.volume * element.prC) / element.csC;
          element.WDcCR = 8; // 8hours= 1 day
          element.WDcS =
            (element.perimeter * element.length * element.prS) / element.csS;
        });
        break;
      case this.slabs:
        this.slabs.forEach((element) => {
          if (!element.thickness) {
            element.thickness = element.width;
          }
          element.WDsF =
            ((element.area + element.perimeter * element.thickness) *
              element.prF) /
            element.csF;
          element.WDsR = (0.09 * element.volume * element.prR) / element.csR;
          element.WDsC = (element.volume * element.prC) / element.csC;
          element.WDsCR = 32; // 32hours= 4 days maybe this should be defined based on area?
          element.WDsS =
            ((element.area + element.perimeter * element.thickness) *
              element.prS) /
            element.csS;
        });
        break;
      case this.foundations:
        this.foundations.forEach((element) => {
          if (!element.thickness) {
            //roofs are slabs but they have the width property instead of thickness
            element.thickness = element.width;
          }
          element.WDfF =
            ((element.area + element.perimeter * element.thickness) *
              element.prF) /
            element.csF;
          element.WDfR = (0.12 * element.volume * element.prR) / element.csR;
          element.WDfC = (element.volume * element.prC) / element.csC;
          element.WDfCR = 32; // 32hours= 4 days maybe this should be defined based on area?
          element.WDfS =
            ((element.area + element.perimeter * element.thickness) *
              element.prS) /
            element.csS;
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
    contentDiv.style.overflowY = 'hidden';
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

    var textDivHeader = document.createElement('div');
    textDivHeader.setAttribute('class', 'p-col-6');
    textDivHeader.innerHTML = '<div class="box">' + 'Property Name' + '</div>';
    textDivHeader.style.color = 'black';
    textDivHeader.style.fontWeight = '800';
    $(this.panel.container)
      .find('#headerLabel')[0]
      .appendChild(textDivHeader as HTMLElement);

    var textDivHeader2 = document.createElement('div');
    textDivHeader2.setAttribute('class', 'p-col-6');
    textDivHeader2.innerHTML =
      '<div class="box">' + 'Property Value' + '</div>';
    textDivHeader2.style.color = 'black';
    textDivHeader2.style.fontWeight = '800';
    $(this.panel.container)
      .find('#headerLabel')[0]
      .appendChild(textDivHeader2 as HTMLElement);

    var textDivA = document.createElement('div');
    textDivA.setAttribute('class', 'p-col-6');
    textDivA.innerHTML = '<div class="box">' + 'Id' + '</div>';
    textDivA.style.color = 'black';
    $(this.panel.container)
      .find('#idProp')[0]
      .appendChild(textDivA as HTMLElement);

    var textDivA2 = document.createElement('div');
    textDivA2.setAttribute('class', 'p-col-6');
    textDivA2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivA2.style.color = 'red';
    $(this.panel.container)
      .find('#idProp')[0]
      .appendChild(textDivA2 as HTMLElement);

    var textDivB = document.createElement('div');
    textDivB.setAttribute('class', 'p-col-6');
    textDivB.innerHTML = '<div class="box">' + 'dbId' + '</div>';
    textDivB.style.color = 'black';
    $(this.panel.container)
      .find('#dbIdProp')[0]
      .appendChild(textDivB as HTMLElement);

    var textDivB2 = document.createElement('div');
    textDivB2.setAttribute('class', 'p-col-6');
    textDivB2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivB2.style.color = 'red';
    $(this.panel.container)
      .find('#dbIdProp')[0]
      .appendChild(textDivB2 as HTMLElement);

    var textDivC = document.createElement('div');
    textDivC.setAttribute('class', 'p-col-6');
    textDivC.innerHTML = '<div class="box">' + 'Volume [m3]' + '</div>';
    textDivC.style.color = 'black';
    $(this.panel.container)
      .find('#volumeProp')[0]
      .appendChild(textDivC as HTMLElement);

    var textDivC2 = document.createElement('div');
    textDivC2.setAttribute('class', 'p-col-6');
    textDivC2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivC2.style.color = 'red';
    $(this.panel.container)
      .find('#volumeProp')[0]
      .appendChild(textDivC2 as HTMLElement);

    var textDivD = document.createElement('div');
    textDivD.setAttribute('class', 'p-col-6');
    textDivD.innerHTML = '<div class="box">' + 'Area [m2]' + '</div>';
    textDivD.style.color = 'black';
    $(this.panel.container)
      .find('#areaProp')[0]
      .appendChild(textDivD as HTMLElement);

    var textDivD2 = document.createElement('div');
    textDivD2.setAttribute('class', 'p-col-6');
    textDivD2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivD2.style.color = 'red';
    $(this.panel.container)
      .find('#areaProp')[0]
      .appendChild(textDivD2 as HTMLElement);

    var textDivE = document.createElement('div');
    textDivE.setAttribute('class', 'p-col-6');
    textDivE.innerHTML = '<div class="box">' + 'Length [m]' + '</div>';
    textDivE.style.color = 'black';
    $(this.panel.container)
      .find('#lengthProp')[0]
      .appendChild(textDivE as HTMLElement);

    var textDivE2 = document.createElement('div');
    textDivE2.setAttribute('class', 'p-col-6');
    textDivE2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivE2.style.color = 'red';
    $(this.panel.container)
      .find('#lengthProp')[0]
      .appendChild(textDivE2 as HTMLElement);

    var textDivF = document.createElement('div');
    textDivF.setAttribute('class', 'p-col-6');
    textDivF.innerHTML = '<div class="box">' + 'Height [m]' + '</div>';
    textDivF.style.color = 'black';
    $(this.panel.container)
      .find('#heightProp')[0]
      .appendChild(textDivF as HTMLElement);

    var textDivF2 = document.createElement('div');
    textDivF2.setAttribute('class', 'p-col-6');
    textDivF2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivF2.style.color = 'red';
    $(this.panel.container)
      .find('#heightProp')[0]
      .appendChild(textDivF2 as HTMLElement);

    var textDivG = document.createElement('div');
    textDivG.setAttribute('class', 'p-col-6');
    textDivG.innerHTML = '<div class="box">' + 'Perimeter [m]' + '</div>';
    textDivG.style.color = 'black';
    $(this.panel.container)
      .find('#perimProp')[0]
      .appendChild(textDivG as HTMLElement);

    var textDivG2 = document.createElement('div');
    textDivG2.setAttribute('class', 'p-col-6');
    textDivG2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivG2.style.color = 'red';
    $(this.panel.container)
      .find('#perimProp')[0]
      .appendChild(textDivG2 as HTMLElement);

    var textDivH = document.createElement('div');
    textDivH.setAttribute('class', 'p-col-6');
    textDivH.innerHTML = '<div class="box">' + 'Width [m]' + '</div>';
    textDivH.style.color = 'black';
    $(this.panel.container)
      .find('#widthProp')[0]
      .appendChild(textDivH as HTMLElement);

    var textDivH2 = document.createElement('div');
    textDivH2.setAttribute('class', 'p-col-6');
    textDivH2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivH2.style.color = 'red';
    $(this.panel.container)
      .find('#widthProp')[0]
      .appendChild(textDivH2 as HTMLElement);

    var textDivI = document.createElement('div');
    textDivI.setAttribute('class', 'p-col-6');
    textDivI.innerHTML =
      '<div class="box">' +
      'Production Rate Install Formwork [h/m2]' +
      '</div>';
    textDivI.style.color = 'black';
    $(this.panel.container)
      .find('#prFormProp')[0]
      .appendChild(textDivI as HTMLElement);

    var textDivI2 = document.createElement('div');
    textDivI2.setAttribute('class', 'p-col-6');
    textDivI2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivI2.style.color = 'red';
    $(this.panel.container)
      .find('#prFormProp')[0]
      .appendChild(textDivI2 as HTMLElement);

    var textDivY = document.createElement('div');
    textDivY.setAttribute('class', 'p-col-6');
    textDivY.innerHTML =
      '<div class="box">' +
      'Production Rate Install Reinforcement [h/t]' +
      '</div>';
    textDivY.style.color = 'black';
    $(this.panel.container)
      .find('#prReinProp')[0]
      .appendChild(textDivY as HTMLElement);

    var textDivY2 = document.createElement('div');
    textDivY2.setAttribute('class', 'p-col-6');
    textDivY2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivY2.style.color = 'red';
    $(this.panel.container)
      .find('#prReinProp')[0]
      .appendChild(textDivY2 as HTMLElement);

    var textDivT = document.createElement('div');
    textDivT.setAttribute('class', 'p-col-6');
    textDivT.innerHTML =
      '<div class="box">' + 'Production Rate Pour Concrete [h/m3]' + '</div>';
    textDivT.style.color = 'black';
    $(this.panel.container)
      .find('#prConcProp')[0]
      .appendChild(textDivT as HTMLElement);

    var textDivT2 = document.createElement('div');
    textDivT2.setAttribute('class', 'p-col-6');
    textDivT2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivT2.style.color = 'red';
    $(this.panel.container)
      .find('#prConcProp')[0]
      .appendChild(textDivT2 as HTMLElement);

    var textDivU = document.createElement('div');
    textDivU.setAttribute('class', 'p-col-6');
    textDivU.innerHTML =
      '<div class="box">' + 'Production Rate Strip Formwork [h/m2]' + '</div>';
    textDivU.style.color = 'black';
    $(this.panel.container)
      .find('#prStrProp')[0]
      .appendChild(textDivU as HTMLElement);

    var textDivU2 = document.createElement('div');
    textDivU2.setAttribute('class', 'p-col-6');
    textDivU2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivU2.style.color = 'red';
    $(this.panel.container)
      .find('#prStrProp')[0]
      .appendChild(textDivU2 as HTMLElement);

    var textDivK = document.createElement('div');
    textDivK.setAttribute('class', 'p-col-6');
    textDivK.innerHTML =
      '<div class="box">' + 'Crew Size Install Formwork [ppl]' + '</div>';
    textDivK.style.color = 'black';
    $(this.panel.container)
      .find('#csFormProp')[0]
      .appendChild(textDivK as HTMLElement);

    var textDivK2 = document.createElement('div');
    textDivK2.setAttribute('class', 'p-col-6');
    textDivK2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivK2.style.color = 'red';
    $(this.panel.container)
      .find('#csFormProp')[0]
      .appendChild(textDivK2 as HTMLElement);

    var textDivL = document.createElement('div');
    textDivL.setAttribute('class', 'p-col-6');
    textDivL.innerHTML =
      '<div class="box">' + 'Crew Size Install Reinforcement [ppl]' + '</div>';
    textDivL.style.color = 'black';
    $(this.panel.container)
      .find('#csReinProp')[0]
      .appendChild(textDivL as HTMLElement);

    var textDivL2 = document.createElement('div');
    textDivL2.setAttribute('class', 'p-col-6');
    textDivL2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivL2.style.color = 'red';
    $(this.panel.container)
      .find('#csReinProp')[0]
      .appendChild(textDivL2 as HTMLElement);

    var textDivM = document.createElement('div');
    textDivM.setAttribute('class', 'p-col-6');
    textDivM.innerHTML =
      '<div class="box">' + 'Crew Size Pour Concrete [ppl]' + '</div>';
    textDivM.style.color = 'black';
    $(this.panel.container)
      .find('#csConcProp')[0]
      .appendChild(textDivM as HTMLElement);

    var textDivM2 = document.createElement('div');
    textDivM2.setAttribute('class', 'p-col-6');
    textDivM2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivM2.style.color = 'red';
    $(this.panel.container)
      .find('#csConcProp')[0]
      .appendChild(textDivM2 as HTMLElement);

    var textDivO = document.createElement('div');
    textDivO.setAttribute('class', 'p-col-6');
    textDivO.innerHTML =
      '<div class="box">' + 'Crew Size Strip Formwork [ppl]' + '</div>';
    textDivO.style.color = 'black';
    $(this.panel.container)
      .find('#csStrProp')[0]
      .appendChild(textDivO as HTMLElement);

    var textDivO2 = document.createElement('div');
    textDivO2.setAttribute('class', 'p-col-6');
    textDivO2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivO2.style.color = 'red';
    $(this.panel.container)
      .find('#csStrProp')[0]
      .appendChild(textDivO2 as HTMLElement);

    var textDivJ = document.createElement('div');
    textDivJ.setAttribute('class', 'p-col-6');
    textDivJ.innerHTML =
      '<div class="box">' + 'Work Density Install Formwork [h]' + '</div>';
    textDivJ.style.color = 'black';
    $(this.panel.container)
      .find('#wdFormProp')[0]
      .appendChild(textDivJ as HTMLElement);

    var textDivJ2 = document.createElement('div');
    textDivJ2.setAttribute('class', 'p-col-6');
    textDivJ2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivJ2.style.color = 'red';
    $(this.panel.container)
      .find('#wdFormProp')[0]
      .appendChild(textDivJ2 as HTMLElement);

    var textDivP = document.createElement('div');
    textDivP.setAttribute('class', 'p-col-6');
    textDivP.innerHTML =
      '<div class="box">' + 'Work Density Install Reinforcement [h]' + '</div>';
    textDivP.style.color = 'black';
    $(this.panel.container)
      .find('#wdReinProp')[0]
      .appendChild(textDivP as HTMLElement);

    var textDivP2 = document.createElement('div');
    textDivP2.setAttribute('class', 'p-col-6');
    textDivP2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivP2.style.color = 'red';
    $(this.panel.container)
      .find('#wdReinProp')[0]
      .appendChild(textDivP2 as HTMLElement);

    var textDivQ = document.createElement('div');
    textDivQ.setAttribute('class', 'p-col-6');
    textDivQ.innerHTML =
      '<div class="box">' + 'Work Density Pour Concrete [h]' + '</div>';
    textDivQ.style.color = 'black';
    $(this.panel.container)
      .find('#wdConcProp')[0]
      .appendChild(textDivQ as HTMLElement);

    var textDivQ2 = document.createElement('div');
    textDivQ2.setAttribute('class', 'p-col-6');
    textDivQ2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivQ2.style.color = 'red';
    $(this.panel.container)
      .find('#wdConcProp')[0]
      .appendChild(textDivQ2 as HTMLElement);

    var textDivR = document.createElement('div');
    textDivR.setAttribute('class', 'p-col-6');
    textDivR.innerHTML =
      '<div class="box">' + 'Work Density Curing of Concrete [h]' + '</div>';
    textDivR.style.color = 'black';
    $(this.panel.container)
      .find('#wdCurProp')[0]
      .appendChild(textDivR as HTMLElement);

    var textDivR2 = document.createElement('div');
    textDivR2.setAttribute('class', 'p-col-6');
    textDivR2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivR2.style.color = 'red';
    $(this.panel.container)
      .find('#wdCurProp')[0]
      .appendChild(textDivR2 as HTMLElement);

    var textDivS = document.createElement('div');
    textDivS.setAttribute('class', 'p-col-6');
    textDivS.innerHTML =
      '<div class="box">' + 'Work Density Strip Formwork [h]' + '</div>';
    textDivS.style.color = 'black';
    $(this.panel.container)
      .find('#wdStrProp')[0]
      .appendChild(textDivS as HTMLElement);

    var textDivS2 = document.createElement('div');
    textDivS2.setAttribute('class', 'p-col-6');
    textDivS2.innerHTML = '<div class="box">' + 'Unset' + '</div>';
    textDivS2.style.color = 'red';
    $(this.panel.container)
      .find('#wdStrProp')[0]
      .appendChild(textDivS2 as HTMLElement);
  }

  //try to find all last children dbids
  public getAllLeafComponents(viewer, callback) {
    var cbCount = 0; // count pending callbacks
    var components = []; // store the results
    var tree; // the instance tree

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
      var allLeafComponents = getLeafComponentsRec(tree.getRootId());
    });
  }

  public getLeafComponentsRec(parent) {
    if (
      this.viewerComponent.viewer.model
        .getInstanceTree()
        .getChildCount(parent) != 0
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
    let tempPanel = document.createElement('div');
    tempPanel.id = 'tempPanel';
    // tempPanel.className = "infoPanel";
    tempPanel.style.cssText = `
        right: 125px;
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
      let hitPoint = hitTest.point;
    }
    return false;
  }

  public async selectionChanged(event: SelectionChangedEventArgs) {
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;
    // this.storeConcrCategObjects();
    ///////////////////////////// TESTING THREEJS/////////////////////////////////////////
    this.handleMouseMove(event);
    ///////////////////////////// TESTING /////////////////////////////////////////

    var meshInfo = this.getComponentGeometry(dbIdArray[0]);
    // console.log(meshInfo);

    ///////////////////////////// TESTING ///////////////////////////////////////
    // this.viewerComponent.viewer.model.getProperties(dbIdArray[0], (data) =>
    // console.log(data)
    // );
    // var root = this.viewerComponent.viewer.model.getInstanceTree().getRootId();
    // // console.log(root);
    // var parent = this.viewerComponent.viewer.model
    //   .getInstanceTree()
    //   .getNodeParentId(dbIdArray[0]);
    // // console.log(parent);
    // var parentOfParent = this.viewerComponent.viewer.model
    //   .getInstanceTree()
    //   .getNodeParentId(parent);
    // // console.log(parentOfParent);
    // var parentOfParentOfParent = this.viewerComponent.viewer.model
    //   .getInstanceTree()
    //   .getNodeParentId(parentOfParent);
    // // console.log(parentOfParentOfParent);
    // this.viewerComponent.viewer.model.getProperties(parent, (data) =>
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

    if (this.isWall(dbIdArray[0])) {
      var correspondingWall = this.walls.find(
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
        $(this.panel.container).find('#heightProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingWall.height.toFixed(2) + '</div>';
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
      var correspondingColumn = this.columns.find(
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
        $(this.panel.container).find('#perimProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingColumn.perimeter.toFixed(2) +
          '</div>';
        // @ts-ignore
        $(this.panel.container).find('#lengthProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingColumn.length.toFixed(2) +
          '</div>';
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
      var correspondingSlab = this.slabs.find(
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
        $(this.panel.container).find('#perimProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" +
          correspondingSlab.perimeter.toFixed(2) +
          '</div>';
        // @ts-ignore
        $(this.panel.container).find('#areaProp')[0].childNodes[1].innerHTML =
          "<div class='box'>" + correspondingSlab.area.toFixed(2) + '</div>';
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

  public getLeafFragIds(model, leafId) {
    const instanceTree = model.getData().instanceTree;
    const fragIds = [];

    instanceTree.enumNodeFragments(leafId, function (fragId) {
      fragIds.push(fragId);
    });

    return fragIds;
  }

  public getComponentGeometry(dbId) {
    const viewer = this.viewerComponent.viewer;
    const fragIds = this.getLeafFragIds(viewer.model, dbId);

    let matrixWorld = null;

    const meshes = fragIds.map(function (fragId) {
      const renderProxy = viewer.impl.getRenderProxy(viewer.model, fragId);

      const geometry = renderProxy.geometry;
      const attributes = geometry.attributes;
      const positions = geometry.vb ? geometry.vb : attributes.position.array;

      const indices = attributes.index.array || geometry.ib;
      const stride = geometry.vb ? geometry.vbstride : 3;
      const offsets = geometry.offsets;

      matrixWorld = matrixWorld || renderProxy.matrixWorld.elements;

      return {
        positions,
        indices,
        offsets,
        stride,
      };
    });

    return {
      matrixWorld,
      meshes,
    };
  }
}

///////////////////////////////////// NOT USED ///////////////////////////////////////////////////

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
