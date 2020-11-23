import { Component, OnInit, Input, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { AppComponent } from 'src/app/app.component';

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
} from '../../viewer/extensions/extension';

import { AuthToken } from 'forge-apis';
import { ApiService } from 'src/app/_services/api.service';

import * as $ from 'jquery';

// Function for async forEach
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  @Input() app: AppComponent;

  public viewerOptions3d: ViewerOptions;
  public encodedmodelurn: string;

  // Graphical Stuff
  public toolbarLevels: Autodesk.Viewing.UI.ToolBar;

  // Model stuff
  public objectsPerLevel: any[] = new Array();


  @ViewChild(ViewerComponent, { static: false }) viewerComponent: ViewerComponent;

  constructor(private api: ApiService) {
    this.api.getspecificProject('5faa62b2079c07001454c421').then(res => {
      this.encodedmodelurn = res.encodedmodelurn;
    });
    this.viewerOptions3d = {
      initializerOptions: {
        env: 'AutodeskProduction',
        getAccessToken: (async (onGetAccessToken) => {
          const authToken: AuthToken = await this.api.get2LToken().then(res => {
            return res.access_token;
          });
          onGetAccessToken(authToken, 30 * 60);
        }),
        api: 'derivativeV2',
      },
      viewerConfig: {
        // IconMarkupExtension wird bei onViewerInitialized geladen
        extensions: ['Autodesk.Snapping', 'Autodesk.ModelStructure'],
        //,'GetPositionExtension'], //[IconMarkupExtension.extensionName], // [GetParameterExtension.extensionName], 
        theme: 'dark-theme',
      },
      onViewerScriptsLoaded: this.scriptsLoaded,
      onViewerInitialized: (async (args: ViewerInitializedEvent) => {
        console.log(this.encodedmodelurn);
        if (this.encodedmodelurn) {
          args.viewerComponent.DocumentId = this.encodedmodelurn;
        }
        this.loadLevelToolbar();


        // this.replaceSpinner();
        // this.loadCustomToolbar();
        // this.loadFacadeToolbar();
        // this.loadSectionToolbar();
        // Graphische Anpassung
        // $('#forge-viewer').hide();
      }),
      // Muss true sein
      showFirstViewable: true,
      // Ist falsch gesetzt => GuiViewer3D => Buttons ausgeblendet in Viewer CSS
      headlessViewer: false,
    };
  }

  ngOnInit(): void {
  }

  public async scriptsLoaded() {
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
    // Button 1
    const button1 = new Autodesk.Viewing.UI.Button('showing-levels');
    button1.addClass('showing-levels');
    // @ts-ignore
    button1.container.children[0].classList.add('fas', 'fa-layer-group');
    // SubToolbar
    const controlGroup = new Autodesk.Viewing.UI.ControlGroup('my-custom-toolbar-levels-controlgroup');
    controlGroup.addControl(button1);
    // Toolbar
    this.toolbarLevels = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-levels', { collapsible: false, alignVertically: true });
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

        this.objectsPerLevel.forEach(object => {
          if (!object.levelName) {
            object.levelName = 'null';
          }
          // Braucht einen Anhang an jede Klasse, da CSS Klasse nicht mit [0-9] beginnen kann
          var annexClass = 'Class_';

          // iterative Button
          var buttonIterativ = new Autodesk.Viewing.UI.Button(annexClass + object.id);

          // Click Event !! Important !!
          buttonIterativ.onClick = () => {
            if (buttonIterativ.getState() === 1) {
              // $('#' + annexClass + object.id).css('background-color', '#FE3123');
              buttonIterativ.setState(0);
              const selected = this.viewerComponent.viewer.getSelection();
              const newselected = selected.concat(object.dbIds);
              this.viewerComponent.viewer.select(newselected);
            }
            else {
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
          $('#' + annexClass + object.id).append('<style>.' + annexClass + object.id + ':before{content: attr(data-before); font-size: 20px; color: white;}</style>');
          $('#' + annexClass + object.id).append('<style>.' + annexClass + object.id + '{width: 178px !important}</style>');
          $('#' + annexClass + object.id).append('<style>.' + annexClass + object.id + '{animation: slideMe .7s ease-in;}</style>');
          $('#' + annexClass + object.id.toString()).attr('data-before', object.levelName);
        });
      }
      else {
        button1.setState(1);
        while (controlGroup.getNumberOfControls() > 1) {
          var tempID = controlGroup.getControlId(1);
          controlGroup.removeControl(tempID);
        }
      }
    };
    this.toolbarLevels.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(this.toolbarLevels.container);
  }

  public async selectionChanged(event: SelectionChangedEventArgs) {
    // console.log(event);
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;
    // console.log(dbIdArray);


    // const instanceTree = this.viewerComponent.viewer.model.getData().instanceTree;
    // const parentId = instanceTree.getNodeParentId(dbIdArray[0]);

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

  public storeLevelObjects() {
    this.app.openSpinner();
    setTimeout(() => {
      const allDbIds = this.getAllDbIds();
      // @ts-ignore
      this.viewerComponent.viewer.model.getBulkProperties(allDbIds, ['LcOaNode:LcOaNodeLayer'], (data) => {
        const allValues = new Array();
        asyncForEach(data, element => {
          allValues.push(element.properties[0].displayValue);
        }).then(() => {
          const unique = allValues.filter((item, i, ar) => ar.indexOf(item) === i);
          asyncForEach(unique, async (level) => {
            await this.viewerComponent.viewer.search(level, (idArray) => {
              this.objectsPerLevel.push({
                levelName: level,
                dbIds: idArray,
                id: this.makeid(5)
              });
            }, (err) => {
            }, ['LcOaNode:LcOaNodeLayer']);
          }).then(() => {
            this.app.closeSpinner();
          });
        });
      });
    }, 1000);
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
}
