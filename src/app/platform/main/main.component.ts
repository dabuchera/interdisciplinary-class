import {
  Component,
  OnInit,
  Input,
  ViewChild,
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
    spinner.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';
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
              if (this.isolatedNodesLevels.length === 0 && this.isolatedNodesConcrete.length === 0) {
                this.isolatedNodesLevels = object.dbIds;
                this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
              }
              else if (this.isolatedNodesLevels.length !== 0 && this.isolatedNodesConcrete.length === 0) {
                this.isolatedNodesLevels = this.isolatedNodesLevels.concat(object.dbIds);
                this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
              }
              else if (this.isolatedNodesLevels.length === 0 && this.isolatedNodesConcrete.length !== 0) {
                this.isolatedNodesLevels = this.isolatedNodesConcrete.filter((item) => {
                  return object.dbIds.indexOf(item) !== -1;
                });
                if (this.isolatedNodesLevels.length === 0) {
                  return null;
                }
                else {
                  this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
                }
              }
              // this.isolatedNodesLevels.length !== 0 && this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesLevels = this.isolatedNodesLevels.concat(object.dbIds);
                this.isolatedNodesLevels = this.isolatedNodesConcrete.filter((item) => {
                  return this.isolatedNodesLevels.indexOf(item) !== -1;
                });
                this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
              }
            }
            else {
              buttonIterativ.setState(1);
              if (this.isolatedNodesConcrete.length === 0) {
                this.isolatedNodesLevels = this.isolatedNodesLevels.filter((item) => {
                  return object.dbIds.indexOf(item) === -1;
                });
                this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
              }
              // this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesLevels = this.isolatedNodesLevels.filter((item) => {
                  return object.dbIds.indexOf(item) === -1;
                });
                this.isolatedNodesLevels = this.isolatedNodesConcrete.filter((item) => {
                  return this.isolatedNodesLevels.indexOf(item) !== -1;
                });
                if (this.isolatedNodesLevels.length === 0) {
                  this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
                }
                else {
                  this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
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
              if (this.isolatedNodesLevels.length === 0 && this.isolatedNodesConcrete.length === 0) {
                this.isolatedNodesConcrete = object.dbIds;
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              }
              else if (this.isolatedNodesLevels.length === 0 && this.isolatedNodesConcrete.length !== 0) {
                this.isolatedNodesConcrete = this.isolatedNodesConcrete.concat(object.dbIds);
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              }
              else if (this.isolatedNodesLevels.length !== 0 && this.isolatedNodesConcrete.length === 0) {
                this.isolatedNodesConcrete = this.isolatedNodesLevels.filter((item) => {
                  return object.dbIds.indexOf(item) !== -1;
                });
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              }
              // this.isolatedNodesLevels.length !== 0 && this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesConcrete = this.isolatedNodesConcrete.concat(object.dbIds);
                this.isolatedNodesConcrete = this.isolatedNodesLevels.filter((item) => {
                  return this.isolatedNodesConcrete.indexOf(item) !== -1;
                });
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              }
            }
            else {
              buttonIterativ.setState(1);
              if (this.isolatedNodesLevels.length === 0) {
                this.isolatedNodesConcrete = this.isolatedNodesConcrete.filter((item) => {
                  return this.isolatedNodesConcrete.indexOf(item) === -1;
                });
                this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
              }
              // this.isolatedNodesConcrete.length !== 0
              else {
                this.isolatedNodesConcrete = this.isolatedNodesConcrete.filter((item) => {
                  return object.dbIds.indexOf(item) === -1;
                });
                this.isolatedNodesConcrete = this.isolatedNodesLevels.filter((item) => {
                  return this.isolatedNodesConcrete.indexOf(item) !== -1;
                });
                if (this.isolatedNodesConcrete.length === 0) {
                  this.viewerComponent.viewer.isolate(this.isolatedNodesLevels);
                }
                else {
                  this.viewerComponent.viewer.isolate(this.isolatedNodesConcrete);
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
        // this.defineAllProp(this.slabs);
        // this.defineAllProp(this.walls);
        // this.defineAllProp(this.columns);
        // this.defineAllProp(this.foundations);

        // this.workDensityColorMap();
        console.log(this.walls);
        // this.defineAllProp(this.walls);
        // test coloring for slabs based on  WD formwork
        // this.colorWdObjects(this.walls, 'WDwF');
        // this.colorWdObjects(this.columns, 'WDcF');
        // this.colorWdObjects(this.slabs, 'WDsF');
        // this.colorWdObjects(this.foundations, 'WDfF');
        this.setupUI();
      } else {
        button1.setState(1);
        this.viewerComponent.viewer.clearThemingColors(
          this.viewerComponent.viewer.model
        );
        var list = document.getElementById('tempPanel');
        // console.log(list);
        document.body.removeChild(list);

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

  public async runDifferentFunc() {
    $('.lds-roller').show();
    // SetTimeout only for vizualization purposes
    setTimeout(async () => {
      const allDbIds = this.getAllDbIds();
      await this.storeLevelObjects().then(async () => {
        await this.storeConcreteElements().then(async () => {
          $('canvas').show();
          $('.lds-roller').hide();
          //   await this.storeCategoryObjects().then(async () => {
          //     console.log(this.walls);
          //     console.log(this.columns);
          //     console.log(this.slabs);
          //     // Integrate here the database connection
          //     await this.getAndSetProperties(this.slabs).then(async () => {
          //       await this.getAndSetProperties(this.walls).then(async () => {
          //         await this.getAndSetProperties(this.columns).then(async () => {
          //           this.setfixedPRAndCS(this.slabs);
          //           this.setfixedPRAndCS(this.walls);
          //           this.setfixedPRAndCS(this.columns);
          //           this.calcWD(this.slabs);
          //           this.calcWD(this.walls);
          //           this.calcWD(this.columns);
          //           console.log('finished');
          //           $('canvas').show();
          //           $('.lds-roller').hide();
          //           console.log(this.walls);
          //           console.log(this.slabs);
          //           console.log(this.columns);
          //           // this.storeCategoryObjects();
          //         });
          //       });
          //     });
          //   });
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
    return await this.getBulkProperties(allDbIds, ['LcOaNode:LcOaNodeLayer']).then(res => {
      const allValues = new Array();
      return asyncForEach(res, (element) => {
        allValues.push(element.properties[0].displayValue);
      }).then(() => {
        const unique = allValues.filter(
          (item, i, ar) => ar.indexOf(item) === i
        );
        return asyncForEach(unique, async (level) => {
          await this.search(level, 'LcOaNode:LcOaNodeLayer').then(idArray => {
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
    return await this.getBulkProperties(allDbIds, ['LcOaNode:LcOaNodeMaterial']).then(res => {
      const allValues = new Array();
      return asyncForEach(res, (element) => {
        allValues.push(element.properties[0].displayValue);
      }).then(() => {
        const uniqMat = allValues.filter(
          (item, i, ar) => ar.indexOf(item) === i
        );
        const concrValues = uniqMat.filter((item) =>
          item.includes('Beton')
        );
        return asyncForEach(concrValues, async (value) => {
          await this.search(value, 'LcOaNode:LcOaNodeMaterial').then(idArray => {
            this.concrObj.push({
              materialName: value,
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

  public async storeCategoryObjects() {
    const allDbIds = this.getAllDbIds();
    return await this.getBulkProperties(allDbIds, ['Category']).then(res => {
      return asyncForEach(res, (element) => {
        if (element.properties[0].displayValue === 'Walls') {
          const wall = new Wall(this.makeid(5), element.dbId);
          wall.category = 'Wall';
          this.walls.push(wall);
        }
        else if (element.properties[0].displayValue === 'Floors') {
          const slab = new Slab(this.makeid(5), element.dbId);
          slab.category = 'Slab';
          this.slabs.push(slab);
        }
        else if (element.properties[0].displayValue === 'Structural Columns') {
          const column = new Column(this.makeid(5), element.dbId);
          column.category = 'Column';
          this.columns.push(column);
        }
      }).then(async () => {
        return await this.getBulkProperties(allDbIds, ['PREDEFINEDTYPE']).then(res => {
          asyncForEach(res, (element) => {
            if (element.properties[0].displayValue === 'ROOF') {
              const slab = new Slab(this.makeid(5), element.dbId);
              this.slabs.push(slab);
            }
          }).then(() => {
            return true;
          });
        });
      });
    });
  }

  public getAllDbIds() {
    const instanceTree = this.viewerComponent.viewer.model.getData().instanceTree;
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
      return await this.getBulkProperties([item.dbId], null).then(async (data) => {
        return await asyncForEach(data, async (element) => {
          return await asyncForEach(element.properties, (prop) => {
            if (
              prop.displayName === 'GrossVolume' ||
              prop.displayName === 'Volume'
            ) {
              item.volume = parseFloat(prop.displayValue);
              // console.log(item);
            }
            else if (
              prop.displayName === 'GrossArea' || // GrossArea is taekn from Quantities
              prop.displayName === 'Area' // Area is taken from Dimensions, but it's the same value
            ) {
              item.area = parseFloat(prop.displayValue);
            }
            else if (prop.displayName === 'Thickness') {
              item.thickness = parseFloat(prop.displayValue);
            }
            else if (
              prop.displayName === 'Perimeter' ||
              prop.displayName === 'Umfang' ||
              // not all columns especially prefabricated have property perimeter
              prop.displayName === 'Umfang_Kreis'
            ) {
              item.perimeter = parseFloat(prop.displayValue);
            }
            else if (prop.displayName === 'GrossSideArea') {
              item.sideArea = parseFloat(prop.displayValue);
            }
            else if (prop.displayName === 'Width') {
              item.width = parseFloat(prop.displayValue);
            }
            else if (prop.displayName === 'Height') {
              item.height = parseFloat(prop.displayValue);
            }
            else if (
              prop.displayName === 'Length' &&
              // There is the same property in the category of dimensions [especially for WALLS] and it's not the same value
              prop.displayCategory === 'Quantities'
            ) {
              item.length = parseFloat(prop.displayValue);
            }
            else if (
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
      });
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
          element.WDwR = 8; // 8hours= 1 day
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
          element.WDcR = 8; // 8hours= 1 day
          element.WDcS =
            (element.perimeter * element.length * element.prS) / element.csS;
        });
        break;
      case this.slabs:
        this.slabs.forEach((element) => {
          // if (!element.thickness) {
          //   element.thickness = element.width;
          // }
          element.WDsF =
            ((element.area + element.perimeter * element.thickness) *
              element.prF) /
            element.csF;
          element.WDsR = (0.09 * element.volume * element.prR) / element.csR;
          element.WDsC = (element.volume * element.prC) / element.csC;
          element.WDsR = 32; // 32hours= 4 days maybe this should be defined based on area?
          element.WDsS =
            ((element.area + element.perimeter * element.thickness) *
              element.prS) /
            element.csS;
        });
        break;
      case this.foundations:
        this.foundations.forEach((element) => {
          if (!element.thickness) {
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

  public async workDensityColorMap() {
    this.colorWdObjects(this.walls, 'WDwCR');
    this.colorWdObjects(this.columns, 'WDcCR');
    this.colorWdObjects(this.slabs, 'WDsCR');
    this.colorWdObjects(this.foundations, 'WDfCR');
  }

  public colorWdObjects(category, wd) {
    category.forEach((item) => {
      // wd = item[wd];
      // console.log(wd, item[wd]);
      // console.log(item.wd);

      // debugger;
      if (item[wd] <= 4) {
        //
        const color = new THREE.Vector4(255 / 256, 245 / 256, 204 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (4 < item[wd] && item[wd] <= 8) {
        //
        const color = new THREE.Vector4(255 / 256, 237 / 256, 160 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (8 < item[wd] && item[wd] <= 12) {
        //
        const color = new THREE.Vector4(254 / 256, 217 / 256, 118 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (12 < item[wd] && item[wd] <= 16) {
        //
        const color = new THREE.Vector4(254 / 256, 178 / 256, 76 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (16 < item[wd] && item[wd] <= 20) {
        //
        const color = new THREE.Vector4(253 / 256, 141 / 256, 60 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (20 < item[wd] && item[wd] <= 24) {
        //
        const color = new THREE.Vector4(252 / 256, 78 / 256, 42 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (24 < item[wd] && item[wd] <= 28) {
        //
        const color = new THREE.Vector4(227 / 256, 26 / 256, 28 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (28 < item[wd] && item[wd] <= 32) {
        //
        const color = new THREE.Vector4(189 / 256, 0 / 256, 38 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (32 < item[wd] && item[wd] <= 36) {
        //
        const color = new THREE.Vector4(128 / 256, 0 / 256, 38 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (36 < item[wd] && item[wd] <= 40) {
        //
        const color = new THREE.Vector4(103 / 256, 0 / 256, 13 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (40 < item[wd]) {
        //
        const color = new THREE.Vector4(37 / 256, 37 / 256, 37 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
    });
  }

  public showPropLegend() {
    const container = this.viewerComponent.viewer.container as HTMLElement;
    this.panel = new Autodesk.Viewing.UI.DockingPanel(container, 'categoryLegend', 'Lean Legend', { localizeTitle: true, addFooter: true });
    this.panel.setVisible(true);
    this.panel.content = document.createElement('div');
    const contentDiv = this.panel.content as HTMLElement;
    contentDiv.classList.add('container', 'border-box');
    contentDiv.style.boxSizing = 'border-box';
    // html imported from ./legendTemplate.html
    $(this.panel.content).append(html);
    contentDiv.style.overflowY = 'hidden';
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
    textDivHeader.setAttribute('class', 'p-col-2');
    textDivHeader.setAttribute('style', 'margin-right: 10px');
    textDivHeader.innerHTML = '<div class="box">' + 'Property Name' + '</div>';
    textDivHeader.style.color = 'black';
    $(this.panel.container).find('#legend')[0].appendChild(textDivHeader as HTMLElement);

    // var textDivHeader = document.createElement('div');
    // textDivHeader.setAttribute('class', 'p-col-1');
    // textDivHeader.innerHTML = '<div class="box"></div>';
    // $(this.panel.container).find('#legend')[0].appendChild(textDivHeader as HTMLElement);

    var textDivHeader2 = document.createElement('div');
    textDivHeader2.setAttribute('class', 'p-col-2');
    textDivHeader2.innerHTML = '<div class="box">' + 'Property Value' + '</div>';
    textDivHeader2.style.color = 'red';
    $(this.panel.container).find('#legend')[0].appendChild(textDivHeader2 as HTMLElement);


    // var iterator = 0;

    // valuesOfParameter.forEach((value, index) => {
    //   if (value === 'null') {
    //     value = null;
    //   }

    //   // Wenn ein additional Parameter
    //   if (additionalParameter) {
    //     var idx = this.customizedParameters.findIndex(
    //       (findParameterIdx) => findParameterIdx.field === parameter
    //     );
    //     var coloredElements: InputObject[] = this.inputs.filter(
    //       (input, index1) => {
    //         // console.log(input.additionalParameter[idx].value);
    //         // console.log(index1);
    //         return input.additionalParameter[idx].value === value;
    //       }
    //     );
    //   } else {
    //     var coloredElements: InputObject[] = this.inputs.filter((input) => {
    //       return input[parameter] === value;
    //     });
    //   }

    //   // console.log(coloredElements);

    //   // Farbe definieren
    //   let random1 = Math.floor(Math.random() * 256);
    //   let random2 = Math.floor(Math.random() * 256);
    //   let random3 = Math.floor(Math.random() * 256);
    //   var hue = 'rgb(' + random1 + ',' + random2 + ',' + random3 + ')';

    //   if (
    //     parameter === 'elevation' ||
    //     parameter === 'opened' ||
    //     parameter === 'lengthAB'
    //   ) {
    //     hue = colors[0][index];
    //     if (hue === undefined) {
    //       // Farbe definieren
    //       let undefined1 = Math.floor(Math.random() * 256);
    //       let undefined2 = Math.floor(Math.random() * 256);
    //       let undefined3 = Math.floor(Math.random() * 256);
    //       var hue =
    //         'rgb(' + undefined1 + ',' + undefined2 + ',' + undefined3 + ')';
    //     }
    //   }
    //   var colorDiv = document.createElement('div');
    //   colorDiv.setAttribute('class', 'p-col-2');
    //   colorDiv.setAttribute('style', 'margin-right: 10px');
    //   colorDiv.setAttribute('id', index.toString() + '0');
    //   colorDiv.innerHTML =
    //     '<div class="box" style="background-color: ' +
    //     hue +
    //     ' ; height: 20px"></div>';
    //   // colorDiv.innerHTML = '<div class="box" style="background-color: ' + hue + ' ; height: 20px"><p-colorPicker [(ngModel)]="archtypecolor"></p-colorPicker></div>';
    //   var box = colorDiv.children[0];
    //   box.setAttribute('value', value);

    //   // Event Listeners
    //   box.addEventListener(
    //     'mouseover',
    //     (event) => {
    //       var targetElement = event.target as HTMLElement;
    //       targetElement.style.backgroundColor = 'rgb(255, 0, 0)';
    //     },
    //     false
    //   );
    //   box.addEventListener(
    //     'mouseout',
    //     (event) => {
    //       var targetElement = event.target as HTMLElement;
    //       targetElement.style.backgroundColor = hue;
    //     },
    //     false
    //   );

    // $(this.panel.container).find('#legend')[0].appendChild(colorDiv as HTMLElement);

    //   var textDiv = document.createElement('div');
    //   textDiv.setAttribute('class', 'p-col-2');
    //   textDiv.setAttribute('id', index.toString() + '1');
    //   textDiv.innerHTML = '<div class="box">' + value + '</div>';
    //   // set style
    //   textDiv.style.color = 'red';
    // $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

    //   // Abstandbox
    //   // var textDiv = document.createElement('div');
    //   // textDiv.setAttribute('class', 'p-col-1');
    //   // textDiv.innerHTML = '<div class="box"></div>';
    //   // $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

    //   var textDiv = document.createElement('div');
    //   textDiv.setAttribute('class', 'p-col-2');
    //   textDiv.setAttribute('id', index.toString() + '2');
    //   textDiv.innerHTML =
    //     '<div class="box">' + coloredElements.length + '</div>';
    //   // set style
    //   textDiv.style.color = 'brown';
    //   $(this.panel.container)
    //     .find('#legend')[0]
    //     .appendChild(textDiv as HTMLElement);

    //   // Test
    //   var textDiv = document.createElement('div');
    //   textDiv.setAttribute('class', 'p-col-2');
    //   textDiv.setAttribute('id', index.toString() + '3');
    //   textDiv.innerHTML =
    //     '<div class="box">' +
    //     ((coloredElements.length / this.inputs.length) * 100).toFixed(3) +
    //     ' %' +
    //     '</div>';
    //   // set style
    //   textDiv.style.color = 'violet';
    //   $(this.panel.container)
    //     .find('#legend')[0]
    //     .appendChild(textDiv as HTMLElement);

    //   // Test
    //   var textDiv = document.createElement('div');
    //   textDiv.setAttribute('class', 'p-col-2');
    //   textDiv.setAttribute('id', index.toString() + '4');
    //   var sumArea = 0;
    //   coloredElements.forEach((coloredElement) => {
    //     sumArea += coloredElement.area;
    //   });
    //   textDiv.innerHTML = '<div class="box">' + sumArea.toFixed(3) + '</div>';
    //   // set style
    //   textDiv.style.color = 'green';
    //   $(this.panel.container)
    //     .find('#legend')[0]
    //     .appendChild(textDiv as HTMLElement);

    //   coloredElements.forEach((element, idx) => {
    //     this.summedInputsColoring += 1;
    //     var name = '';
    //     if (element.objectPath.indexOf('/')) {
    //       name = element.objectPath.split('/')[
    //         element.objectPath.split('/').length - 1
    //       ];
    //     } else {
    //       name = element.objectPath;
    //     }
    //     let color = new THREE.Vector4(
    //       random1 / 256,
    //       random2 / 256,
    //       random3 / 256,
    //       1
    //     );
    //     if (
    //       parameter === 'elevation' ||
    //       parameter === 'opened' ||
    //       parameter === 'lengthAB'
    //     ) {
    //       color = colors[1][index];
    //     }
    //     this.viewerComponent.viewer.search(
    //       name,
    //       (idArray) => {
    //         // console.log(element.instance);
    //         // console.log(idArray);
    //         this.viewerComponent.viewer.setThemingColor(
    //           idArray[0],
    //           color,
    //           this.viewerComponent.viewer.model,
    //           true
    //         );
    //         iterator += 1;
    //         // Wenn iterator gleich die Länge ist dass alle Objekte wieder zeigen
    //         // Korrektion für coloredElements.length !== this.inputs.length
    //         if (iterator === this.inputs.length - 50) {
    //           $('.spinner').hide();
    //           this.viewerComponent.viewer.showAll();
    //           this.viewerComponent.viewer.container.removeEventListener(
    //             'contextmenu',
    //             this.rigthClickEventListener
    //           );
    //           this.messageService.clear();
    //           setTimeout(() => {
    //             $('#summedInputsColoring').text(
    //               this.summedInputsColoring.toString()
    //             );
    //           }, 3000);
    //         }
    //       },
    //       (err) => {
    //         this.messageService.add({
    //           key: 'warning',
    //           severity: 'error',
    //           summary: 'Error',
    //           detail: 'Something with COLORING went wrong: ' + err,
    //         });
    //       },
    //       ['name']
    //     );
    //   });
    // });
  }

  //try to find all visible ids
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
          },
          false
        );
      } else {
        components.push(parent);
      }
      if (--cbCount == 0) callback(components);
    }
    viewer.getObjectTree(function (objectTree) {
      tree = objectTree;
      var allLeafComponents = getLeafComponentsRec(tree.getRootId());
    });
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

  public async selectionChanged(event: SelectionChangedEventArgs) {
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;
    if (this.panel) {
      // @ts-ignore
      $(this.panel.container).find('#legend')[0].childNodes[1].innerHTML = '<div class=\'box\'>' + dbIdArray + '</div>';
    }
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