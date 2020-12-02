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
import { Foundation } from '../models/foundation';

import { AuthToken } from 'forge-apis';
import { ApiService } from 'src/app/_services/api.service';

import * as $ from 'jquery';
import { Xliff } from '@angular/compiler';
import { async } from '@angular/core/testing';
import { valHooks } from 'jquery';
declare var THREE: any;

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
  // Model stuff
  public objectsPerLevel: any[] = new Array();
  public concrObj: any[] = new Array();
  public walls: Wall[] = new Array();
  public slabs: Slab[] = new Array();
  public columns: Column[] = new Array();
  public foundations: Foundation[] = new Array();
  public wallsConc: Wall[] = new Array();
  public slabsConc: Slab[] = new Array();
  public columnsConc: Column[] = new Array();
  public foundationsConc: Foundation[] = new Array();
  public panel: Autodesk.Viewing.UI.DockingPanel;

  @ViewChild(ViewerComponent, { static: false })
  viewerComponent: ViewerComponent;

  protected rigthClickEventListener: EventListener;

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
        this.loadTestToolbar();

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
              const tempIsolated = this.viewerComponent.viewer.impl.visibilityManager.getIsolatedNodes();
              const newselected1 = selected.concat(object.dbIds);
              // const newselected = selected.concat(object.dbIds);
              const newselected =
                tempIsolated.length !== 0
                  ? newselected1.filter((item) => tempIsolated.includes(item))
                  : newselected1;
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
              // $('#' + annexClass + object.id).css('background-color', '#FE3123');
              buttonIterativ.setState(0);
              const selected = this.viewerComponent.viewer.getSelection();
              const tempIsolated = this.viewerComponent.viewer.impl.visibilityManager.getIsolatedNodes();
              const newselected1 = selected.concat(object.dbIds);
              // console.log(tempIsolated);
              const newselected =
                tempIsolated.length !== 0
                  ? newselected1.filter((item) => tempIsolated.includes(item))
                  : newselected1;
              // const newselected = newselected1.filter((item) =>
              //   tempIsolated.includes(item)

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
    this.toolbarTest = new Autodesk.Viewing.UI.ToolBar(
      'my-custom-view-toolbar-test',
      { collapsible: false, alignVertically: true }
    );

    button1.onClick = (event) => {
      if (button1.getState() === 1) {
        button1.setState(0);
        //Test functions
        console.log('Test started');
        // this.defineAllProp(this.slabs);
        // this.defineAllProp(this.walls);
        // this.defineAllProp(this.columns);
        // this.defineAllProp(this.foundations);

        this.workDensityColorMap();
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
    console.log(this.toolbarTest);
    this.toolbarTest.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(this.toolbarTest.container);
  }

  public async selectionChanged(event: SelectionChangedEventArgs) {
    // console.log(event);
    // const d = this.viewerComponent.viewer.impl.visibilityManager.getIsolatedNodes();
    // console.log(d);
    console.log('selectionChanged');
    // this.storeConcrCategElements();
    // console.log(this.columns);
    // console.log(this.columnsConc);
    // console.log(this.slabs);
    // console.log(this.slabsConc);
    // console.log(this.walls);
    // console.log(this.wallsConc);
    // console.log(this.foundations);
    // console.log(this.foundationsConc);
    // this.findConcrCategElements(this.walls);
    // this.findConcrCategElements();
    // const s3 = this.defineAllProp(this.slabs);
    // const w3 = this.defineAllProp(this.walls);
    // const c3 = this.defineAllProp(this.columns);
    // console.log(s3);
    // console.log(w3);
    // console.log(c3);
    // const w = this.getAndSetProperties(this.walls);
    // console.log(w);
    // const c = this.getAndSetProperties(this.columns);
    // console.log(c);
    // const foundationsDbIds = new Array();
    // console.log(this.foundations);
    // this.foundations.forEach((el) => {
    //   foundationsDbIds.push(el.dbID);
    // });
    // console.log(foundationsDbIds);
    // this.viewerComponent.viewer.model.getBulkProperties(
    //   foundationsDbIds,
    //   null,
    //   (data) => {
    //     // console.log(data);
    //     // asyncForEach(data, (element) => {
    //     //   if (element.properties[0].displayValue.includes('Beton')) {
    //     //     var foundationConc = new Foundation(this.makeid(5), element.dbId);
    //     //     this.foundationsConc.push(foundationConc);
    //     //   }
    //     // });
    //   }
    // );

    // console.log(this.foundations);
    // console.log(this.foundationsConc);

    const dbIdArray = (event as any).dbIdArray;
    // console.log(dbIdArray);

    // this.getAllLeafComponents(this.viewerComponent.viewer, function (dbIds) {
    //   console.log('Found ' + dbIds.length + ' leaf nodes');
    // });
    // const d = this.viewerComponent.viewer.impl.visibilityManager.getIsolatedNodes();
    // console.log(d);

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
    // console.log(this.foundations);
    const allDbIds = this.getAllDbIds();
    // @ts-ignore
    // this.viewerComponent.viewer.model.getBulkProperties(
    //   allDbIds,
    //   ['Family Name'],
    //   (data) => {
    //     const allValues = new Array();
    //     asyncForEach(data, (element) => {
    //       allValues.push(element.properties[0].displayValue);
    //     }).then(() => {
    //       const unique = allValues.filter(
    //         (item, i, ar) => ar.indexOf(item) === i
    //       );
    //       console.log(unique);
    //     });

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
    //   }
    // );
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
            if (
              element.properties[0].displayValue === 'Structural Foundations'
            ) {
              var foundation = new Foundation(this.makeid(5), element.dbId);
              this.foundations.push(foundation);
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
      // this.viewerComponent.viewer.model.getBulkProperties(
      //   allDbIds,
      //   ['Type Comments'],
      //   (data) => {
      //     asyncForEach(data, (element) => {
      //       if (
      //         element.properties[0].displayValue === 'Bodenplattenvertiefung'
      //       ) {
      //         var foundation = new Foundation(this.makeid(5), element.dbId);
      //         this.foundations.push(foundation);
      //       }
      //     });
      //   }
      // );
    }, 1000);
  }

  public storeConcrCategElements() {
    const wallsDbIds = new Array();
    this.walls.forEach((el) => {
      wallsDbIds.push(el.dbID);
    });
    this.viewerComponent.viewer.model.getBulkProperties(
      wallsDbIds,
      ['LcOaNode:LcOaNodeMaterial'],
      (data) => {
        asyncForEach(data, (element) => {
          if (element.properties[0].displayValue.includes('Beton')) {
            var wallConc = new Wall(this.makeid(5), element.dbId);
            this.wallsConc.push(wallConc);
          }
        });
      }
    );
    const columnsDbIds = new Array();
    this.columns.forEach((el) => {
      columnsDbIds.push(el.dbID);
    });
    // console.log(columnsDbIds);
    this.viewerComponent.viewer.model.getBulkProperties(
      columnsDbIds,
      ['LcOaNode:LcOaNodeMaterial'],
      (data) => {
        asyncForEach(data, (element) => {
          if (element.properties[0].displayValue.includes('Beton')) {
            var columnConc = new Column(this.makeid(5), element.dbId);
            this.columnsConc.push(columnConc);
          }
        });
      }
    );
    const slabsDbIds = new Array();
    this.slabs.forEach((el) => {
      slabsDbIds.push(el.dbID);
    });
    // console.log(slabsDbIds);
    this.viewerComponent.viewer.model.getBulkProperties(
      slabsDbIds,
      ['LcOaNode:LcOaNodeMaterial'],
      (data) => {
        asyncForEach(data, (element) => {
          if (element.properties[0].displayValue.includes('Beton')) {
            var slabConc = new Slab(this.makeid(5), element.dbId);
            this.slabsConc.push(slabConc);
          }
        });
      }
    );
    const foundationsDbIds = new Array();
    // console.log(this.foundations);
    this.foundations.forEach((el) => {
      foundationsDbIds.push(el.dbID);
    });
    // console.log(foundationsDbIds);
    this.viewerComponent.viewer.model.getBulkProperties(
      foundationsDbIds,
      ['LcOaNode:LcOaNodeMaterial'],
      (data) => {
        // console.log(data);
        asyncForEach(data, (element) => {
          if (element.properties[0].displayValue.includes('Beton')) {
            var foundationConc = new Foundation(this.makeid(5), element.dbId);
            this.foundationsConc.push(foundationConc);
          }
        });
      }
    );
    // this.viewerComponent.viewer.model.getBulkProperties(
    //   foundationsDbIds,
    //   ['Type Comments'],
    //   (data) => {
    //     // console.log(data);
    //     asyncForEach(data, (element) => {
    //       if (element.properties[0].displayValue === 'Bodenplattenvertiefung') {
    //         var foundationConc = new Foundation(this.makeid(5), element.dbId);
    //         this.foundationsConc.push(foundationConc);
    //       }
    //     });
    //   }
    // );

    // console.log(this.slabsConc.length);
  }
  // console.log(concrValues);

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

  public async getAndSetProperties(category) {
    category.forEach((item) => {
      const instanceTree = this.viewerComponent.viewer.model.getData()
        .instanceTree;
      this.viewerComponent.viewer.model.getBulkProperties(
        [item.dbID],
        null,
        (data) => {
          console.log(data);
          data.forEach((element) => {
            element.properties.forEach((prop) => {
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
                prop.displayName === 'Umfang' ||
                prop.displayName === 'Umfang_Kreis' //not all columns especially prefabricated have property perimeter
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
              if (
                prop.displayName === 'Stützenhöhe' //There is the same property in the category of dimensions [especially for WALLS] and it's not the same value
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

      case this.columns:
        this.columns.forEach((element) => {
          element.WDcF =
            (element.perimeter * element._length * element.prF) / element.csF;
          element.WDcR = (0.15 * element.volume * element.prR) / element.csR;
          element.WDcC = (element.volume * element.prC) / element.csC;
          element.WDcCR = 8; // 8hours= 1 day
          element.WDcS =
            (element.perimeter * element._length * element.prS) / element.csS;
        });

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
  public async defineAllProp(category) {
    //walls
    const categ = await this.getAndSetProperties(category);
    const categor = await this.setfixedPRAndCS(categ);
    const cat = await this.calcWD(categor);
    console.log(cat);
    return cat;
  }

  public async workDensityColorMap() {
    await this.defineAllProp(this.walls);
    await this.defineAllProp(this.columns);
    await this.defineAllProp(this.slabs);
    await this.defineAllProp(this.foundations);
    // console.log(slabstemp);
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
        let color = new THREE.Vector4(255 / 256, 245 / 256, 204 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (4 < item[wd] && item[wd] <= 8) {
        //
        let color = new THREE.Vector4(255 / 256, 237 / 256, 160 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (8 < item[wd] && item[wd] <= 12) {
        //
        let color = new THREE.Vector4(254 / 256, 217 / 256, 118 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (12 < item[wd] && item[wd] <= 16) {
        //
        let color = new THREE.Vector4(254 / 256, 178 / 256, 76 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (16 < item[wd] && item[wd] <= 20) {
        //
        let color = new THREE.Vector4(253 / 256, 141 / 256, 60 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (20 < item[wd] && item[wd] <= 24) {
        //
        let color = new THREE.Vector4(252 / 256, 78 / 256, 42 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (24 < item[wd] && item[wd] <= 28) {
        //
        let color = new THREE.Vector4(227 / 256, 26 / 256, 28 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (28 < item[wd] && item[wd] <= 32) {
        //
        let color = new THREE.Vector4(189 / 256, 0 / 256, 38 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (32 < item[wd] && item[wd] <= 36) {
        //
        let color = new THREE.Vector4(128 / 256, 0 / 256, 38 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (36 < item[wd] && item[wd] <= 40) {
        //
        let color = new THREE.Vector4(103 / 256, 0 / 256, 13 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
      if (40 < item[wd]) {
        //
        let color = new THREE.Vector4(37 / 256, 37 / 256, 37 / 256, 1);
        this.viewerComponent.viewer.setThemingColor(
          item.dbID,
          color,
          this.viewerComponent.viewer.model,
          true
        );
      }
    });
  }

  public showPropLegend(
    parameter: string,
    valuesOfParameter: any[],
    additionalParameter: boolean
  ) {
    // Alle Objekte hidden und dann Farbe ändern
    $('.spinner').show();
    // DO NOT Rigth Click while LOADING
    this.viewerComponent.viewer.container.addEventListener(
      'contextmenu',
      this.rigthClickEventListener
    );

    this.viewerComponent.viewer.setGhosting(false);
    this.viewerComponent.viewer.hide(
      this.viewerComponent.viewer.model.getRootId()
    );

    var container = this.viewerComponent.viewer.container as HTMLElement;
    this.panel = new Autodesk.Viewing.UI.DockingPanel(
      container,
      'categoryLegend',
      'Category Legend: ' + parameter,
      { localizeTitle: true, addFooter: true }
    );
    this.panel.setVisible(true);
    this.panel.content = document.createElement('div');
    const contentDiv = this.panel.content as HTMLElement;
    contentDiv.classList.add('container', 'border-box');
    contentDiv.style.boxSizing = 'border-box';
    $(this.panel.content).append(html); // html impotred from ./legendTemplate.html
    contentDiv.style.overflowY = 'scroll';
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
    textDivHeader.innerHTML = '<div class="box">' + 'Property' + '</div>';
    textDivHeader.style.color = 'black';
    $(this.panel.container)
      .find('#legend')[0]
      .appendChild(textDivHeader as HTMLElement);

    // var textDivHeader = document.createElement('div');
    // textDivHeader.setAttribute('class', 'p-col-1');
    // textDivHeader.innerHTML = '<div class="box"></div>';
    // $(this.panel.container).find('#legend')[0].appendChild(textDivHeader as HTMLElement);

    var textDivHeader2 = document.createElement('div');
    textDivHeader2.setAttribute('class', 'p-col-2');
    textDivHeader2.innerHTML = '<div class="box">' + 'Value' + '</div>';
    textDivHeader2.style.color = 'red';
    $(this.panel.container)
      .find('#legend')[0]
      .appendChild(textDivHeader2 as HTMLElement);

    // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
    // let tempViewerComponent = this.viewerComponent;
    // $(this.panel.container)
    //   .find('.docking-panel-close')
    //   .click((e) => {
    //     tempViewerComponent.viewer.clearThemingColors(
    //       this.viewerComponent.viewer.model
    //     );
    //     return false;
    //   });

    if (typeof valuesOfParameter[0] !== 'boolean') {
      valuesOfParameter = valuesOfParameter.sort((a, b) => a - b);
    }
    // Dies ist die Sortierung für den Parameter Status
    if (parameter === 'status') {
      valuesOfParameter = [
        'none',
        'fabricated started',
        'fabricated',
        'sent',
        'installed',
        'broken',
      ];
    }

    // console.log(valuesOfParameter);

    // definies colors according to the parameter -> rgb + Vector4
    let colors: Array<any> = this.setColor(parameter);

    var iterator = 0;

    valuesOfParameter.forEach((value, index) => {
      if (value === 'null') {
        value = null;
      }

      // Wenn ein additional Parameter
      if (additionalParameter) {
        var idx = this.customizedParameters.findIndex(
          (findParameterIdx) => findParameterIdx.field === parameter
        );
        var coloredElements: InputObject[] = this.inputs.filter(
          (input, index1) => {
            // console.log(input.additionalParameter[idx].value);
            // console.log(index1);
            return input.additionalParameter[idx].value === value;
          }
        );
      } else {
        var coloredElements: InputObject[] = this.inputs.filter((input) => {
          return input[parameter] === value;
        });
      }

      // console.log(coloredElements);

      // Farbe definieren
      let random1 = Math.floor(Math.random() * 256);
      let random2 = Math.floor(Math.random() * 256);
      let random3 = Math.floor(Math.random() * 256);
      var hue = 'rgb(' + random1 + ',' + random2 + ',' + random3 + ')';

      if (
        parameter === 'elevation' ||
        parameter === 'opened' ||
        parameter === 'lengthAB'
      ) {
        hue = colors[0][index];
        if (hue === undefined) {
          // Farbe definieren
          let undefined1 = Math.floor(Math.random() * 256);
          let undefined2 = Math.floor(Math.random() * 256);
          let undefined3 = Math.floor(Math.random() * 256);
          var hue =
            'rgb(' + undefined1 + ',' + undefined2 + ',' + undefined3 + ')';
        }
      }
      var colorDiv = document.createElement('div');
      colorDiv.setAttribute('class', 'p-col-2');
      colorDiv.setAttribute('style', 'margin-right: 10px');
      colorDiv.setAttribute('id', index.toString() + '0');
      colorDiv.innerHTML =
        '<div class="box" style="background-color: ' +
        hue +
        ' ; height: 20px"></div>';
      // colorDiv.innerHTML = '<div class="box" style="background-color: ' + hue + ' ; height: 20px"><p-colorPicker [(ngModel)]="archtypecolor"></p-colorPicker></div>';
      var box = colorDiv.children[0];
      box.setAttribute('value', value);

      // Event Listeners
      box.addEventListener(
        'mouseover',
        (event) => {
          var targetElement = event.target as HTMLElement;
          targetElement.style.backgroundColor = 'rgb(255, 0, 0)';
        },
        false
      );
      box.addEventListener(
        'mouseout',
        (event) => {
          var targetElement = event.target as HTMLElement;
          targetElement.style.backgroundColor = hue;
        },
        false
      );

      // Event Listener für Click auf Farb Box
      box.addEventListener(
        'click',
        (event) => {
          // Border Top
          $('#' + index.toString() + '0').css('border-top', '2px solid red');
          $('#' + index.toString() + '1').css('border-top', '2px solid red');
          $('#' + index.toString() + '2').css('border-top', '2px solid red');
          $('#' + index.toString() + '3').css('border-top', '2px solid red');
          $('#' + index.toString() + '4').css('border-top', '2px solid red');
          // Border Bottom
          $('#' + index.toString() + '0').css('border-bottom', '2px solid red');
          $('#' + index.toString() + '1').css('border-bottom', '2px solid red');
          $('#' + index.toString() + '2').css('border-bottom', '2px solid red');
          $('#' + index.toString() + '3').css('border-bottom', '2px solid red');
          $('#' + index.toString() + '4').css('border-bottom', '2px solid red');
          setTimeout(() => {
            // Border Top
            $('#' + index.toString() + '0').css('border-top', '');
            $('#' + index.toString() + '1').css('border-top', '');
            $('#' + index.toString() + '2').css('border-top', '');
            $('#' + index.toString() + '3').css('border-top', '');
            $('#' + index.toString() + '4').css('border-top', '');
            // Border Bottom
            $('#' + index.toString() + '0').css('border-bottom', '');
            $('#' + index.toString() + '1').css('border-bottom', '');
            $('#' + index.toString() + '2').css('border-bottom', '');
            $('#' + index.toString() + '3').css('border-bottom', '');
            $('#' + index.toString() + '4').css('border-bottom', '');
          }, 5000);

          coloredElements.forEach((element) => {
            // @ts-ignore
            this.viewerComponent.viewer.clearThemingColors(
              this.viewerComponent.viewer.getHiddenModels()[0]
            );
            var name = '';
            if (element.objectPath.indexOf('/')) {
              name = element.objectPath.split('/')[
                element.objectPath.split('/').length - 1
              ];
            } else {
              name = element.objectPath;
            }
            // let color = new THREE.Vector4(random1 / 256, random2 / 256, random3 / 256, 1);
            let color = new THREE.Vector4(256 / 256, 0 / 256, 0 / 256, 1);
            if (
              parameter === 'elevation' ||
              parameter === 'opened' ||
              parameter === 'lengthAB'
            ) {
              // color = colors[1][index];
              color = new THREE.Vector4(256 / 256, 0 / 256, 0 / 256, 1);
            }
            let dbId = this.viewerComponent.viewer.search(
              name,
              (idArray) => {
                this.viewerComponent.viewer.setThemingColor(
                  idArray[0],
                  color,
                  this.viewerComponent.viewer.model,
                  true
                );
                this.redSelectedDbIDs.push(idArray[0]);
              },
              (err) => {
                this.messageService.add({
                  key: 'warning',
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Something with COLORING went wrong: ' + err,
                });
              },
              ['name']
            );
          });
        },
        false
      );
      $(this.panel.container)
        .find('#legend')[0]
        .appendChild(colorDiv as HTMLElement);

      var textDiv = document.createElement('div');
      textDiv.setAttribute('class', 'p-col-2');
      textDiv.setAttribute('id', index.toString() + '1');
      textDiv.innerHTML = '<div class="box">' + value + '</div>';
      // set style
      textDiv.style.color = 'red';
      $(this.panel.container)
        .find('#legend')[0]
        .appendChild(textDiv as HTMLElement);

      // Abstandbox
      // var textDiv = document.createElement('div');
      // textDiv.setAttribute('class', 'p-col-1');
      // textDiv.innerHTML = '<div class="box"></div>';
      // $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

      var textDiv = document.createElement('div');
      textDiv.setAttribute('class', 'p-col-2');
      textDiv.setAttribute('id', index.toString() + '2');
      textDiv.innerHTML =
        '<div class="box">' + coloredElements.length + '</div>';
      // set style
      textDiv.style.color = 'brown';
      $(this.panel.container)
        .find('#legend')[0]
        .appendChild(textDiv as HTMLElement);

      // Test
      var textDiv = document.createElement('div');
      textDiv.setAttribute('class', 'p-col-2');
      textDiv.setAttribute('id', index.toString() + '3');
      textDiv.innerHTML =
        '<div class="box">' +
        ((coloredElements.length / this.inputs.length) * 100).toFixed(3) +
        ' %' +
        '</div>';
      // set style
      textDiv.style.color = 'violet';
      $(this.panel.container)
        .find('#legend')[0]
        .appendChild(textDiv as HTMLElement);

      // Test
      var textDiv = document.createElement('div');
      textDiv.setAttribute('class', 'p-col-2');
      textDiv.setAttribute('id', index.toString() + '4');
      var sumArea = 0;
      coloredElements.forEach((coloredElement) => {
        sumArea += coloredElement.area;
      });
      textDiv.innerHTML = '<div class="box">' + sumArea.toFixed(3) + '</div>';
      // set style
      textDiv.style.color = 'green';
      $(this.panel.container)
        .find('#legend')[0]
        .appendChild(textDiv as HTMLElement);

      coloredElements.forEach((element, idx) => {
        this.summedInputsColoring += 1;
        var name = '';
        if (element.objectPath.indexOf('/')) {
          name = element.objectPath.split('/')[
            element.objectPath.split('/').length - 1
          ];
        } else {
          name = element.objectPath;
        }
        let color = new THREE.Vector4(
          random1 / 256,
          random2 / 256,
          random3 / 256,
          1
        );
        if (
          parameter === 'elevation' ||
          parameter === 'opened' ||
          parameter === 'lengthAB'
        ) {
          color = colors[1][index];
        }
        this.viewerComponent.viewer.search(
          name,
          (idArray) => {
            // console.log(element.instance);
            // console.log(idArray);
            this.viewerComponent.viewer.setThemingColor(
              idArray[0],
              color,
              this.viewerComponent.viewer.model,
              true
            );
            iterator += 1;
            // Wenn iterator gleich die Länge ist dass alle Objekte wieder zeigen
            // Korrektion für coloredElements.length !== this.inputs.length
            if (iterator === this.inputs.length - 50) {
              $('.spinner').hide();
              this.viewerComponent.viewer.showAll();
              this.viewerComponent.viewer.container.removeEventListener(
                'contextmenu',
                this.rigthClickEventListener
              );
              this.messageService.clear();
              setTimeout(() => {
                $('#summedInputsColoring').text(
                  this.summedInputsColoring.toString()
                );
              }, 3000);
            }
          },
          (err) => {
            this.messageService.add({
              key: 'warning',
              severity: 'error',
              summary: 'Error',
              detail: 'Something with COLORING went wrong: ' + err,
            });
          },
          ['name']
        );
      });
    });
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
}
