import {
  Component,
  OnInit,
  Input,
  ViewChild,
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
          CoordinatesAxesExtension.extensionName,
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
        this.loadLevelToolbar();
        this.loadConcreteToolbar();

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

  ngOnInit(): void {}

  public async scriptsLoaded() {
    Extension.registerExtension(
      'CoordinatesAxesExtension',
      CoordinatesAxesExtension
    );

    // Extension für das Markup bei der Facade Functionality
    // Extension.registerExtension('IconMarkupExtension', IconMarkupExtension);
    // Extension für die farbigen Achsen des World-Koordinatensystem
    // Extension.registerExtension('CoordinatesAxesExtension', CoordinatesAxesExtension);
    // Extension für die Section Functionality
    // Extension.registerExtension('SectionExtension', SectionExtension);

    // Extension.registerExtension(GetParameterExtension.extensionName, GetParameterExtension);
    // @ts-ignore
    // Extension.registerExtension('Autodesk.Snapping', Autodesk.Viewing.Extensions.Snapper);
    // Extension.registerExtension('GetPositionExtension', GetPositionExtension);
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
        // this.instanceTree = this.viewerComponent.viewer.model.getInstanceTree();
        // console.log(this.instanceTree);
        // console.log(this.viewerComponent.viewer.model);
        // console.log(this.viewerComponent.viewer.model.getDocumentNode());
        // console.log(this.viewerComponent.viewer.model.getData());
        // console.log(this.viewerComponent.viewer.model.getRoot());
        // console.log(this.viewerComponent.viewer.getExtension('Autodesk.ModelStructure'));

        // // @ts-ignore
        // console.log(this.viewerComponent.viewer.model.findProperty('LcOaNode:LcOaNodeLayer'));

        // this.viewerComponent.viewer.model.getBulkProperties(dbIds,
        //   [name], (data) => {
        //     console.log(data);
        //   });
        // valuesOfParameter = res;
        // // console.log('valuesOfParameter');
        // // console.log(valuesOfParameter);

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
              // $('#' + annexClass + object.id).css('background-color', '#FE3123');
              buttonIterativ.setState(0);
              const selected = this.viewerComponent.viewer.getSelection();
              const newselected = selected.concat(object.dbIds);
              this.viewerComponent.viewer.select(newselected);
            } else {
              buttonIterativ.setState(1);
              const selected = this.viewerComponent.viewer.getSelection();
              const newselected = selected.filter((item) => {
                return object.dbIds.indexOf(item) === -1;
              });
              this.viewerComponent.viewer.select(newselected);
              // $('#' + annexClass + object.id).css('background-color', '#A80000');
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
              // $('#' + annexClass + object.id).css('background-color', '#FE3123');
              buttonIterativ.setState(0);
              const selected = this.viewerComponent.viewer.getSelection();
              const newselected = selected.concat(object.dbIds);
              this.viewerComponent.viewer.select(newselected);
            } else {
              buttonIterativ.setState(1);
              const selected = this.viewerComponent.viewer.getSelection();
              const newselected = selected.filter((item) => {
                return object.dbIds.indexOf(item) === -1;
              });
              this.viewerComponent.viewer.select(newselected);
              // $('#' + annexClass + object.id).css('background-color', '#A80000');
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

  public async selectionChanged(event: SelectionChangedEventArgs) {
    // console.log(event);
    console.log('selectionChanged');
    const s3 = this.defineAllProp(this.slabs);
    const w3 = this.defineAllProp(this.walls);
    const c3 = this.defineAllProp(this.columns);
    console.log(s3);
    console.log(w3);
    console.log(c3);
    // const w = this.getAndSetProperties(this.walls);
    // console.log(w);
    // const c = this.getAndSetProperties(this.columns);
    // console.log(c);

    const dbIdArray = (event as any).dbIdArray;
    // console.log(dbIdArray);

    const instanceTree = this.viewerComponent.viewer.model.getData()
      .instanceTree;
    // console.log(instanceTree);
    // const nodeTyp = instanceTree.getNodeType(dbIdArray[0]);
    // console.log(nodeTyp);

    const parentId = instanceTree.getNodeParentId(dbIdArray[0]);
    const parentId2 = instanceTree.getNodeParentId(parentId);
    const parentId3 = instanceTree.getNodeParentId(parentId2);
    // console.log(parentId);
    // asyncForEach(this.slabs, async (item) => {
    //   await this.viewerComponent.viewer.model.getBulkProperties(
    //     [item.dbID],
    //     null,
    //     (data) => {
    //       // console.log(item.dbID);
    //       asyncForEach(data, (element) => {
    //         console.log(data);
    //         asyncForEach(element.properties, (prop) => {
    //           if (prop.displayName === 'GrossArea') {
    //             item.area = parseFloat(prop.displayValue);
    //             // console.log(item);
    //           }
    //         });
    //       });
    //     }
    //   );
    // });
    this.viewerComponent.viewer.model.getBulkProperties(
      [dbIdArray[0]],
      null,
      (data) => {
        console.log('dbdArray');
        console.log(data);
      }
    );
    this.viewerComponent.viewer.model.getBulkProperties(
      [parentId3],
      null,
      (data) => {
        console.log('parentId');
        console.log(data);
      }
    );

    // let propertyArray = new Array();

    // this.viewerComponent.viewer.model.getProperties(parentId, res => {
    //   console.log(res);
    //   propertyArray = res.properties;
    //   console.log(propertyArray);
    //   const a = propertyArray.find(ele => {
    //     if (ele.displayName === 'LAYERTHICKNESS') {
    //       return true;
    //     }
    //   });
    //   console.log(a);
    //   console.log(a.displayValue);
    // }, err => {
    //   console.log(err);
    // });
  }

  //  Complete Isolate function
  // Example of use:
  // isolateFull(viewer, viewer.model, [39, 45, 61])

  // public isolateFull(viewer, model = null, dbIds = []) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       model = model || viewer.model;

  //       // First we call the native isolate function
  //       // so hidden components will not interfere
  //       // with selection
  //       viewer.isolate(dbIds);

  //       const targetIds = Array.isArray(dbIds) ? dbIds : [dbIds];

  //       const targetLeafIds = await ViewerToolkit.getLeafNodes(
  //         model,
  //         targetIds
  //       );

  //       const leafIds = await ViewerToolkit.getLeafNodes(model);

  //       const leafTasks = leafIds.map((dbId) => {
  //         return new Promise((resolveLeaf) => {
  //           const show =
  //             !targetLeafIds.length || targetLeafIds.indexOf(dbId) > -1;

  //           viewer.impl.visibilityManager.setNodeOff(dbId, !show);

  //           resolveLeaf();
  //         });
  //       });

  //       return Promise.all(leafTasks);
  //     } catch (ex) {
  //       return reject(ex);
  //     }
  //   });
  // }

  // // Helper method: returns all leaf node dbIds for
  // // given input dbIds. A leaf node is a node that
  // // doesn't have any children
  // public getLeafNodes(model, dbIds) {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       const instanceTree = model.getData().instanceTree;

  //       dbIds = dbIds || instanceTree.getRootId();

  //       const dbIdArray = Array.isArray(dbIds) ? dbIds : [dbIds];

  //       let leafIds = [];

  //       const getLeafNodesRec = (id) => {
  //         var childCount = 0;

  //         instanceTree.enumNodeChildren(id, (childId) => {
  //           getLeafNodesRec(childId);

  //           ++childCount;
  //         });

  //         if (childCount == 0) {
  //           leafIds.push(id);
  //         }
  //       };

  //       for (var i = 0; i < dbIdArray.length; ++i) {
  //         getLeafNodesRec(dbIdArray[i]);
  //       }

  //       return resolve(leafIds);
  //     } catch (ex) {
  //       return reject(ex);
  //     }
  //   });
  // }

  public runDifferentFunc() {
    this.storeLevelObjects();
    this.storeConcreteElements();
    this.storeCategoryObjects();
    // const s = this.getAndSetProperties(this.slabs);
    // console.log(s);
    // const s2 = this.setfixedPRAndCS(this.slabs);
    // console.log(s2);
    // const s3 = this.calcWD(this.slabs);
    // console.log(s3);
    // Do a function for filling more attributes to the object of the this.walls
  }

  public storeLevelObjects() {
    this.app.openSpinner();
    setTimeout(() => {
      const allDbIds = this.getAllDbIds();
      // @ts-ignore
      this.viewerComponent.viewer.model.getBulkProperties(
        allDbIds,
        ['LcOaNode:LcOaNodeLayer'],
        (data) => {
          const allValues = new Array();
          asyncForEach(data, (element) => {
            allValues.push(element.properties[0].displayValue);
          }).then(() => {
            const unique = allValues.filter(
              (item, i, ar) => ar.indexOf(item) === i
            );
            // console.log(unique);
            asyncForEach(unique, async (level) => {
              await this.viewerComponent.viewer.search(
                level,
                (idArray) => {
                  this.objectsPerLevel.push({
                    levelName: level,
                    dbIds: idArray,
                    id: this.makeid(5),
                  });
                },
                (err) => {},
                ['LcOaNode:LcOaNodeLayer']
              );
            }).then(() => {
              this.app.closeSpinner();
            });
          });
        }
      );
    }, 1000);
  }

  public storeConcreteElements() {
    // this.app.openSpinner();
    setTimeout(() => {
      const allDbIds = this.getAllDbIds();
      // @ts-ignore
      this.viewerComponent.viewer.model.getBulkProperties(
        allDbIds,
        ['LcOaNode:LcOaNodeMaterial'],
        (data) => {
          const allValues = new Array();
          asyncForEach(data, (element) => {
            allValues.push(element.properties[0].displayValue);
            // console.log(data);
          }).then(() => {
            // console.log(data);
            const uniqMat = allValues.filter(
              (value, i, ar) => ar.indexOf(value) === i
            );
            const concrValues = uniqMat.filter((item) =>
              item.includes('Beton')
            );
            // console.log(concrValues);
            asyncForEach(concrValues, async (value: string) => {
              await this.viewerComponent.viewer.search(
                value,
                (idArray) => {
                  this.concrObj.push({
                    materialName: value,
                    dbIds: idArray,
                    id: this.makeid(5),
                  });
                },
                (err) => {},
                ['LcOaNode:LcOaNodeMaterial']
              );
            });
            // this.viewerComponent.viewer.isolate(this.concrIds[1].dbIds);
          });
        }
      );
    }, 1000);
    // console.log(this.concrObj);
    // this.viewerComponent.viewer.isolate(this.concrIds[1]);
    // this.viewerComponent.viewer.isolate(this.concrIds[1].dbIds);
  }

  public storeCategoryObjects() {
    setTimeout(() => {
      const allDbIds = this.getAllDbIds();
      this.viewerComponent.viewer.model.getBulkProperties(
        allDbIds,
        ['Category'],
        (data) => {
          asyncForEach(data, (element) => {
            if (element.properties[0].displayValue === 'Walls') {
              var wall = new Wall(this.makeid(5), element.dbId);
              this.walls.push(wall);
            }
            if (element.properties[0].displayValue === 'Floors') {
              var slab = new Slab(this.makeid(5), element.dbId);
              this.slabs.push(slab);
            }

            if (element.properties[0].displayValue === 'Structural Columns') {
              var column = new Column(this.makeid(5), element.dbId);
              this.columns.push(column);
            }
          });
        }
      );
      this.viewerComponent.viewer.model.getBulkProperties(
        allDbIds,
        ['PREDEFINEDTYPE'],
        (data) => {
          asyncForEach(data, (element) => {
            if (element.properties[0].displayValue === 'ROOF') {
              var slab = new Slab(this.makeid(5), element.dbId);
              this.slabs.push(slab);
            }
          });
        }
      );
    }, 1000);
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

  public getAndSetProperties(category) {
    asyncForEach(category, (item) => {
      const instanceTree = this.viewerComponent.viewer.model.getData()
        .instanceTree;
      this.viewerComponent.viewer.model.getBulkProperties(
        [item.dbID],
        null,
        (data) => {
          // console.log(item.dbID);
          asyncForEach(data, (element) => {
            asyncForEach(element.properties, (prop) => {
              if (
                prop.displayName === 'GrossVolume' ||
                prop.displayName === 'Volume'
              ) {
                item.volume = parseFloat(prop.displayValue);
                // console.log(item);
              }
              if (
                prop.displayName === 'GrossArea' || // GrossArea is taekn from Quantities
                prop.displayName === 'Area' // Area is taken from Dimensions, but it's the same value
              ) {
                item.area = parseFloat(prop.displayValue);
              }
              if (prop.displayName === 'Thickness') {
                item.thickness = parseFloat(prop.displayValue);
              }
              if (
                prop.displayName === 'Perimeter' ||
                prop.displayName === 'Umfang' //not all columns especially prefabricated have property perimeter
              ) {
                item.perimeter = parseFloat(prop.displayValue);
              }
              if (prop.displayName === 'GrossSideArea') {
                item.sideArea = parseFloat(prop.displayValue);
              }
              if (prop.displayName === 'Width') {
                item.width = parseFloat(prop.displayValue);
              }
              if (prop.displayName === 'Height') {
                item.height = parseFloat(prop.displayValue);
              }
              if (
                prop.displayName === 'Length' &&
                prop.displayCategory === 'Quantities' //There is the same property in the category of dimensions [especially for WALLS] and it's not the same value
              ) {
                item._length = parseFloat(prop.displayValue);
              }
            });
          });
        }
      );
    });
    return category;
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
            (element.perimeter * element._length * element.prF) / element.csF;
          element.WDcR = (0.11 * element.volume * element.prR) / element.csR;
          element.WDcC = (element.volume * element.prC) / element.csC;
          element.WDcS =
            (element.perimeter * element._length * element.prS) / element.csS;
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
  public defineAllProp(category) {
    this.getAndSetProperties(category);
    this.setfixedPRAndCS(category);
    this.calcWD(category);
    return category;
  }
}
