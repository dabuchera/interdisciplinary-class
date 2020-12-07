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

import { AuthToken } from 'forge-apis';
import { ApiService } from 'src/app/_services/api.service';

import * as $ from 'jquery';
import { Xliff } from '@angular/compiler';
import { async } from '@angular/core/testing';
import { valHooks } from 'jquery';

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

  public isolatedNodesConcrete: number[] = new Array();
  public isolatedNodesLevels: number[] = new Array();

  // Model stuff
  public objectsPerLevel: any[] = new Array();
  public concrObj: any[] = new Array();
  public walls: Wall[] = new Array();
  public slabs: Slab[] = new Array();
  public columns: Column[] = new Array();

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
        console.log(this.viewerComponent.viewer)
        // this.viewerComponent.viewer.showModel.subscribe((value) => { 
        // console.log(value);
        // this.replaceSpinner();
        // this.loadCustomToolbar();
        // this.loadFacadeToolbar();
        // this.loadSectionToolbar();
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
    console.log()
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
    this.toolbarConcrete = new Autodesk.Viewing.UI.ToolBar(
      'my-custom-view-toolbar-concrete',
      { collapsible: false, alignVertically: true }
    );
    this.toolbarConcrete.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(
      this.toolbarConcrete.container
    );
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
      const allValues = new Array();
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
              var slab = new Slab(this.makeid(5), element.dbId);
              this.slabs.push(slab);
            }
          }).then(() => {
            return true;
          });
        });
      });
    });
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
        asyncForEach(this.walls, (element) => {
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
        asyncForEach(this.columns, (element) => {
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
        asyncForEach(this.slabs, (element) => {
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
        asyncForEach(this.walls, (element) => {
          element.WDwF =
            (2 *
              (element.sideArea + element.width * element.height) *
              element.prF) /
            element.csF;
          element.WDwR = (0.17 * element.volume * element.prR) / element.csR; // ?* 0.17tons/m3
          element.WDwC = (element.volume * element.prC) / element.csC; // ?* tons
          element.WDwS =
            (2 *
              (element.sideArea + element.width * element.height) *
              element.prS) /
            element.csS;
        });

      case this.columns:
        asyncForEach(this.columns, (element) => {
          element.WDcF =
            (element.perimeter * element.length * element.prF) / element.csF;
          element.WDcR = (0.11 * element.volume * element.prR) / element.csR;
          element.WDcC = (element.volume * element.prC) / element.csC;
          element.WDcS =
            (element.perimeter * element.length * element.prS) / element.csS;
        });

      case this.slabs:
        asyncForEach(this.slabs, (element) => {
          if (!element.thickness) {
            element.thickness = element.width;
          }
          element.WDsF =
            ((element.area + element.perimeter * element.thickness) *
              element.prF) /
            element.csF;
          element.WDsR = (0.12 * element.volume * element.prR) / element.csR;
          element.WDsC = (element.volume * element.prC) / element.csC;
          element.WDsS =
            ((element.area + element.perimeter * element.thickness) *
              element.prS) /
            element.csS;
        });
    }
    return category;
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

  public async selectionChanged(event: SelectionChangedEventArgs) {
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;
    console.log(this.viewerComponent.viewer.anyLayerHidden());
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