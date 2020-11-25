/// <reference types="forge-viewer" />
import {
  Component, OnInit, Input, ViewChild, ComponentFactoryResolver, Injector, HostListener
} from '@angular/core';
import { SecurePlatformComponent } from '../secure-platform/secure-platform.component';
import { Router } from '@angular/router';
import { AuthService, ApiService } from 'src/app/_services';
import { MessageService, MenuItem } from 'primeng/api';
import { InputObject } from '../../models/input';
import { SearchInput } from '../../models/searchInput';

import { trigger, state, style, transition, animate } from '@angular/animations';

import html from './legendTemplate.html';

// export interface TreeNode {
//   label?: string;
//   data?: any;
//   icon?: any;
//   expandedIcon?: any;
//   collapsedIcon?: any;
//   children?: TreeNode[];
//   leaf?: boolean;
//   expanded?: boolean;
//   type?: string;
//   app?: TreeNode;
//   partialSelected?: boolean;
//   styleClass?: string;
//   draggable?: boolean;
//   droppable?: boolean;
//   selectable?: boolean;
// }

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
} from '../../viewer/extensions/extension';

import { AuthToken } from 'forge-apis';

import { CoordinatesAxesExtension } from './extensions/coordinatesAxesExtension';
import { SectionExtension } from './extensions/sectionExtension';
import { IconMarkupExtension } from './extensions/iconMarkupExtension';
import { GetPositionExtension } from './extensions/getPositionExtension';



// import { DOCUMENT_URN } from './config';
// import { Utils } from 'src/app/utils/utils';
import { ERPObject } from 'src/app/models/erpModel';
// import { element } from 'protractor';
// import { resolve } from 'url';
import { ContextMenu } from 'primeng/contextmenu';
import { SectionObject } from 'src/app/models/section';
import { PdfComponent } from '../pdf/pdf.component';
import { element } from 'protractor';
import { CustomizedParameter } from 'src/app/models/customizedParameter';
import { runInThisContext } from 'vm';
import { InputSwitch } from 'primeng/inputswitch/public_api';
import { filter } from 'rxjs/operators';

declare var THREE: any;

// Funktionen für asynchrones forEach
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

@Component({
  selector: 'app-editing',
  templateUrl: './editing.component.html',
  styleUrls: ['./editing.component.css'],
  animations: [
    trigger('animation', [
      state('visible', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition('void => *', [
        style({ transform: 'translateX(50%)', opacity: 0 }),
        animate('300ms ease-out')
      ]),
      transition('* => void', [
        animate(('250ms ease-in'), style({
          height: 0,
          opacity: 0,
          transform: 'translateX(50%)'
        }))
      ])
    ])
  ],
})

export class EditingComponent implements OnInit {

  @Input('SecurePlatformComponent') platform: SecurePlatformComponent;
  isMobile: boolean;
  multiSelectedMobileInput: InputObject[] = new Array();
  mobileInput: any;
  firstAdditionalparameter: any;

  whichInput: string = '';

  @ViewChild(ViewerComponent, { static: false }) viewerComponent: ViewerComponent;

  // create member that holds the function reference
  protected clickViewEventListenerClick: EventListener;

  protected rigthClickEventListener: EventListener;


  inputs: InputObject[] = null;
  input: InputObject = new InputObject('generic');
  searchInputObject = new SearchInput('generic');
  multiSelectDbIds = new Array();
  redSelectedDbIDs = new Array();

  // Pdf für die Elemente zeigen
  public showingPdf: boolean = false;

  // Für ng build github
  public message: any;

  inputloaded = false;
  editTable = false;
  unsavedChanged = false;
  toggle = false;

  geometricButtonBoolean: boolean = false;
  pmButtonBoolean: boolean = false;
  erpButtonBoolean: boolean = false;
  additionalButtonBoolean: boolean = false;

  colorMap: any[];
  keepColorArray: any[] = new Array();
  colorMapBoolean: boolean = false;

  // * Parameter für den Viewer *//

  public viewerOptions3d: ViewerOptions;
  public inputName: string;
  // Dies ist die ID welche das Objekt im Viewer hat
  public dbId: number;
  public panel: Autodesk.Viewing.UI.DockingPanel;
  public pdfPanel: Autodesk.Viewing.UI.DockingPanel;

  public toolbarMultiSelect: Autodesk.Viewing.UI.ToolBar;
  public toolbarFacade: Autodesk.Viewing.UI.ToolBar;
  public toolbarERP: Autodesk.Viewing.UI.ToolBar;
  public toolbarSectionRotation: Autodesk.Viewing.UI.ToolBar;
  public toolbarMobile: Autodesk.Viewing.UI.ToolBar;


  // Facade Functionality
  public markupIcons: Array<Object>;
  public selectedFacadeEnabled: boolean = false;
  public selectedFacade: String;
  public valueOfParameterFacadeArray: Array<Object> = new Array();

  // Summed Area bei Multiselect
  public summedArea: number = 0;
  public summedlengthAB: number = 0;
  public summedlengthBC: number = 0;
  public summedlengthCD: number = 0;
  public summedlengthDA: number = 0;

  // Viewer im Section Modus
  public sectionMode: boolean = false;

  // Viewer im ERP Modus
  public erpMode: boolean = false;
  public differentiateTypesMode: boolean = false;
  // Standard ist dass Coloring Clearing eingeschaltet ist
  public coloringClearing: boolean = true;
  selectedERPObject: ERPObject = null;
  erpObjects: ERPObject[] = null;

  // PDFs Handling
  public pdfsLoaded: boolean = false;
  existingPdfsPerInstance: Array<InputObject[]> = new Array();

  // RechtsKlick für PDF löschen
  public cmDeletePDFItems: MenuItem[];
  @ViewChild('cmDeletePDF', { static: false }) cmDeletePDF: ContextMenu;
  public whichButton: string;

  // PDF Names
  public pdfNaming: string[];

  // Show PDF **************************************************************************
  public componentRef: any;

  // URN Wireframe
  // dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE5LTEwLTE3LTEzLTE1LTM2LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL0VYRV9EUlZfRTFCLjEuQ0FUUGFydA

  // Subtype <-> Instance
  public booleanSubtypeInsteadOfInstance: boolean = false;
  public summedInputsColoring: number = 0;

  // Section Extension
  public hitTest: any;
  public sameFacadedbIds: Array<number>;
  public normal: any;

  // Additional Parameter
  @ViewChild('overlayCreateParameter', { static: false }) overlayCreateParameter: any;
  public displayDialogCustomizedParameter = false;
  public customizedParameter: CustomizedParameter = new CustomizedParameter('generic');
  public selectedCustomizedParameter: CustomizedParameter;
  public newCustomizedParameter: boolean;
  public cols: any[];
  public customizedParameters: CustomizedParameter[] = new Array();
  public additionalParameterBoolean: boolean = false;

  constructor(private router: Router, public auth: AuthService, private api: ApiService, private messageService: MessageService,
    private componentFactoryResolver: ComponentFactoryResolver) {
    this.clickViewEventListenerClick = (event) => this.showCustomView(event);
    this.rigthClickEventListener = (event) => this.doNotRightClick();

    this.viewerOptions3d = {
      initializerOptions: {
        env: 'AutodeskProduction',
        getAccessToken: (async (onGetAccessToken) => {
          const authToken: AuthToken = await this.api.get2LToken();
          this.auth.currentUserValue.twolegggedToken = authToken.access_token;
          onGetAccessToken(this.auth.currentUserValue.twolegggedToken, 30 * 60);
        }),
        api: 'derivativeV2',
      },
      viewerConfig: {
        // IconMarkupExtension wird bei onViewerInitialized geladen
        extensions: ['Autodesk.Snapping'], //, 'GetPositionExtension'], //[IconMarkupExtension.extensionName], // [GetParameterExtension.extensionName], 
        theme: 'dark-theme',
      },
      onViewerScriptsLoaded: this.scriptsLoaded,
      onViewerInitialized: (async (args: ViewerInitializedEvent) => {
        if (this.platform.currentProject.encodedmodelurn) {
          args.viewerComponent.DocumentId = this.platform.currentProject.encodedmodelurn;

          if (!this.isMobile) {
            this.loadCustomToolbar();
            this.loadFacadeToolbar();
            this.loadSectionToolbar();
          }
          else {
            this.loadCustomToolbar();
            this.loadMobileToolbar();
          }
        }
        else {
          // Graphische Anpassung
          $('#forge-viewer').hide();
          // args.viewerComponent.viewer.uninitialize();
          this.messageService.clear();
          this.messageService.add({ key: 'noModel', sticky: true, severity: 'warn', summary: 'NOT AVAILABLE', detail: 'Do you want to add a Model' });
          this.platform.app.openOverlay();
        }
      }),
      // Muss true sein
      showFirstViewable: true,
      // Ist falsch gesetzt => GuiViewer3D => Buttons ausgeblendet in Viewer CSS
      headlessViewer: false,
    };
  }

  ngOnInit() {
    this.isMobile = this.platform.app.isMobile;

    // this.showingPdf = true;
    // console.log('ngOnInit EditingComponent');
    // // console.log(this.platform.currentProject.name);
    // // // console.log(this.platform.currentProject.encodedmodelurn);
    this.cols = [
      { field: 'field', header: 'Name' },
      { field: 'dataType', header: 'Data Type' },
    ];

    this.api.getAllInputs(this.platform.currentProject._id).then(
      res => {
        if (res.length === 0) {
          this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Not available', detail: 'No Information about panels available' });
        }
        else {
          if (res[0].instance) {
            console.log('Instance in Datenbank vorhanden!!');
            this.inputs = res;
            this.inputs.forEach(input => {
              input.pdf = false;
              // input.additionalParameter = new Array(
              //   { field: 'TestParameter1', dataType: 'string', value: 'Value TestParameter1', internID: this.makeid(20) },
              //   { field: 'TestParameter2', dataType: 'number', value: Math.random(), internID: this.makeid(20) });
            });
          }
          else {
            // Converting
            console.log('Instance nicht Datenbank vorhanden!! => Converting Subtype to Instance');
            this.booleanSubtypeInsteadOfInstance = true;
            res.forEach(element => {
              // @ts-ignore
              if (element.subtype) {
                // @ts-ignore
                element.instance = element.subtype.toString();
              }
              else {
                element.instance = null;
              }
              // @ts-ignore
              delete element.subtype;
            });
            this.inputs = res;
            this.inputs.forEach(input => {
              input.pdf = false;
            });
          }
          this.inputloaded = true;

          // Beim ersten die Additional Parameter abholen
          this.inputs[0].additionalParameter.forEach(param => {
            this.customizedParameters.push({ field: param.field, dataType: param.dataType, internID: param.internID, value: null });
          });

          this.auth.getAccessToken().then(async (getAccessTokenRes) => {
            // console.log(getAccessTokenRes);
            if (getAccessTokenRes) {
              this.api.getIDForPDFsProject(this.platform.currentProject._id, getAccessTokenRes).subscribe(async (OneDriveProjectID) => {
                await this.api.getPDFsProject(OneDriveProjectID, getAccessTokenRes).then(ress => {
                  // console.log(ress);
                  if (ress) {
                    console.log('PDF Doubles');
                    console.log(this.getDuplicateArrayElements(ress));
                    var iterator = 0;
                    console.log(ress);
                    asyncForEach(ress, async element => {
                      var pdfName = element.slice(0, -4);
                      var foundInputs = await this.inputs.filter(input => {
                        var length = input.instance.length;
                        if (length === 1) {
                          var instanceNumber = '000' + input.instance;
                        }
                        else if (length === 2) {
                          var instanceNumber = '00' + input.instance;
                        }
                        else if (length === 3) {
                          var instanceNumber = '0' + input.instance;
                        }
                        else {
                          var instanceNumber: string = input.instance;
                        }
                        if ('A' + input.type + '.' + instanceNumber === pdfName) {
                          return true;
                        }
                        else {
                          return false;
                        }
                      });
                      this.existingPdfsPerInstance.push(foundInputs);
                      foundInputs.forEach(input => {
                        input.pdf = true;
                      });
                      iterator += foundInputs.length;
                    }).then(() => {
                      this.pdfsLoaded = true;
                      this.messageService.add({
                        key: 'warning', severity: 'success', summary: 'PDF', detail: 'There are ' + iterator + ' Pdfs available', life: 20000
                      });
                      console.log('PDFs loaded');
                    });
                  }
                  else {
                    this.messageService.add({
                      key: 'warning', severity: 'success', summary: 'PDF', detail: 'There are zero Pdfs available', life: 20000
                    });
                  }
                });
              });
            }
            else {
              if (!this.isMobile) {
                this.messageService.add({
                  key: 'warning', severity: 'error', summary: 'Error',
                  detail: 'You have to be Logged in to One Drive for PDF Viewing', life: 10000
                });
              }
            }
          });

          console.log('Inputs Length: ' + this.inputs.length);
          console.log(this.inputs);

          // for the mobile version
          if (this.isMobile) {
            if (this.inputs[0].additionalParameter.length > 0) {
              this.firstAdditionalparameter = this.inputs[0].additionalParameter[0];
            }
            else {
              this.firstAdditionalparameter = { field: 'NONE', value: 'NONE' };
            }
          }
          if (this.viewerComponent.viewer) {
            setTimeout(() => {
              var instanceTree = this.viewerComponent.viewer.model.getData().instanceTree;
              var allDbIdsStr = Object.keys(instanceTree.nodeAccess.dbIdToIndex);

              // tslint:disable-next-line: radix
              var allDbIds = allDbIdsStr.map((id) => parseInt(id));
              console.log('Number of DbIds: ' + allDbIds.length);
              console.log(allDbIds);
            }, 5000);
          }
        }
      }
    );
    this.erpObjects = this.platform.ERPData;
    this.api.getERPforProject(this.platform.currentProject._id).then(res => {
      // Aussortieren !!!!! ELE TEST
      this.erpObjects = res;
      this.computingStatusERP();
      this.erpObjects = this.erpObjects.filter(resObject => {
        return resObject.statFam0 === 'ELE' && resObject.description.indexOf('proto') === -1
          && resObject.description.indexOf('PMU') === -1 && resObject.description.indexOf('test') === -1
          && resObject.description.indexOf('spécial') === -1;
      });
      console.log('erpObjects Length: ' + this.erpObjects.length);
    });

    this.cmDeletePDFItems = [
      { label: 'Delete Pdf', icon: 'fa fa-minus', command: (event) => this.deletePDF() }
    ];

    // if (this.platform.currentProject.name === 'ONU_MNG') {
    //   this.pdfNaming = ['A', ''];
    // }
    // else if (this.platform.currentProject.name === 'OXFORD') {
    //   this.pdfNaming = ['K', '-8502'];
    // }
  }

  // * Funktionen für den Viewer *//

  public async scriptsLoaded() {
    // Extension für das Markup bei der Facade Functionality
    Extension.registerExtension('IconMarkupExtension', IconMarkupExtension);
    // Extension für die farbigen Achsen des World-Koordinatensystem
    Extension.registerExtension('CoordinatesAxesExtension', CoordinatesAxesExtension);
    // Extension für die Section Functionality
    Extension.registerExtension('SectionExtension', SectionExtension);

    // Extension.registerExtension(GetParameterExtension.extensionName, GetParameterExtension);
    // @ts-ignore
    // Extension.registerExtension('Autodesk.Snapping', Autodesk.Viewing.Extensions.Snapper);
    // Extension.registerExtension('GetPositionExtension', GetPositionExtension);
  }

  public loadDocument(args: ViewerInitializedEvent) {
    // console.log(this.platform);
    // console.log(args);
    // Utils.delay(500);
    // var a = this.viewerComponent.viewer;
    // console.log();
    // tslint:disable-next-line: max-line-length
    // args.viewerComponent.DocumentId = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE5LTEwLTE3LTEzLTE1LTM2LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL0VYRV9EUlZfRTFCLjEuQ0FUUGFydA';
  }

  public deletePDF() {
    console.log('Not Implemented');
    // if (this.whichButton === 'quality') {
    //   this.api.getInfobyName(this.input.project + '_' + this.input.type + this.pdfNaming[1] + '.pdf').then(res => {
    //     if (res === null) {
    //       this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Not available', detail: 'No Plan PDF existing' });
    //     }
    //     else {
    //       this.api.deletePDF(res.file.file.id).then(result => {
    //         this.messageService.add({ key: 'warning', severity: 'success', summary: 'PDF Delete', detail: result.message });
    //       });
    //     }
    //   });
    // }
    // else if (this.whichButton === 'plan') {
    //   this.api.getInfobyName(this.input.project + '_' + this.input.type + this.pdfNaming[1] + '.pdf').then(res => {
    //     if (res === null) {
    //       this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Not available', detail: 'No Plan PDF existing' });
    //     }
    //     else {
    //       this.api.deletePDF(res.file.file.id).then(result => {
    //         this.messageService.add({ key: 'warning', severity: 'success', summary: 'PDF Delete', detail: result.message });
    //       });
    //     }
    //   });
    // }
    // else if (this.whichButton === 'catalog') {
    //   this.api.getInfobyName(this.input.project + '_' + this.pdfNaming[0] + this.input.type + this.pdfNaming[1] + '.pdf').then(res => {
    //     if (res === null) {
    //       this.messageService.add({ key: 'warning', severity: 'warn', summary: 'PDF Delete', detail: 'No Plan PDF existing' });
    //     }
    //     else {
    //       this.api.deletePDF(res.file.file.id).then(result => {
    //         this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Not available', detail: result.message });
    //       });
    //     }
    //   });
    // }
  }

  // * Funktionen für das PDF Handling *//

  public rigthClick(event: MouseEvent, button: string) {
    if (this.input.inputId === null) {
      this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'There is NO PANEL selected' });
      return false;
    }
    this.cmDeletePDF.show(event);
    this.whichButton = button;
    return false;
  }

  public async showAvailablePDFs() {
    $('.spinner').show();
    // DO NOT Rigth Click while LOADING
    this.viewerComponent.viewer.container.addEventListener('contextmenu', this.rigthClickEventListener);

    this.viewerComponent.viewer.setGhosting(false);
    this.viewerComponent.viewer.hide(this.viewerComponent.viewer.model.getRootId());


    await asyncForEach(this.existingPdfsPerInstance, async (groupbyPDF) => {
      await asyncForEach(groupbyPDF, input => {
        var name = '';
        if (input.objectPath.indexOf('/')) {
          name = input.objectPath.split('/')[input.objectPath.split('/').length - 1];
        }
        else {
          name = input.objectPath;
        }
        let color = new THREE.Vector4(0 / 256, 100 / 256, 0 / 256, 1);
        this.viewerComponent.viewer.search(name, (idArray) => {
          this.viewerComponent.viewer.setThemingColor(idArray[0], color, this.viewerComponent.viewer.model, true);
        }, (err) => {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something with COLORING went wrong: ' + err });
        }, ['name']);
      });
    }).then(() => {
      $('.spinner').hide();
      this.viewerComponent.viewer.showAll();
      this.viewerComponent.viewer.container.removeEventListener('contextmenu', this.rigthClickEventListener);
      this.messageService.clear();
    });
  }

  public treeTableButton(buttonBoolean: string) {
    switch (buttonBoolean) {
      case 'geometricButtonBoolean':
        this.geometricButtonBoolean = !this.geometricButtonBoolean;
        break;
      case 'pmButtonBoolean':
        this.pmButtonBoolean = !this.pmButtonBoolean;
        break;
      case 'erpButtonBoolean':
        this.erpButtonBoolean = !this.erpButtonBoolean;
        break;
      case 'additionalButtonBoolean':
        if (this.customizedParameters.length === 0) {
          this.messageService.add({
            key: 'warning', severity: 'warn', summary: 'Information',
            detail: 'No additional Parameter in this Project', life: 5000
          });
        }
        else {
          this.additionalButtonBoolean = !this.additionalButtonBoolean;
        }
        break;
    }
  }

  public getDuplicateArrayElements(arr) {
    var sorted_arr = arr.slice().sort();
    var results = [];
    for (var i = 0; i < sorted_arr.length - 1; i++) {
      if (sorted_arr[i + 1] === sorted_arr[i]) {
        results.push(sorted_arr[i]);
      }
    }
    return results;
  }

  // Funktionen für additional Parameter
  public addingNewParameter(event) {
    if (this.viewerComponent.viewer.getSelectionCount() === 0) {
      this.overlayCreateParameter.toggle(event);
    }
    else {
      this.messageService.add({
        key: 'warning', severity: 'error', summary: 'Error',
        detail: 'Please deselect all panels', life: 5000
      });
    }
  }

  public showDialogToAdd() {
    this.newCustomizedParameter = true;
    this.customizedParameter = new CustomizedParameter('generic');
    this.customizedParameter.internID = this.makeid(20);
    this.displayDialogCustomizedParameter = true;
  }

  public makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  public async closingOverlay() {
    this.platform.app.openSpinner();
    setTimeout(async () => {
      // console.log('closing Overlay');
      var deletedParameter = 0;
      var modifiedParameter = 0;
      var addedParameter = 0;
      var keepParameter = 0;

      // Zuerst über customizedParameters iterieren
      await asyncForEach(this.customizedParameters, async (parameter, index) => {
        // console.log(parameter);
        // console.log(index);
        // Beim ersten schauen ob vorhanden
        if (this.inputs[0].additionalParameter.find(o => {
          if (o.internID === parameter.internID) { return true; }
        })) {
          if (this.inputs[0].additionalParameter.find(o => {
            if (o.field === parameter.field) { return true; }
          })) {
            keepParameter += 1;
            // console.log('Found');
          }
          else {
            modifiedParameter += 1;
            return await asyncForEach(this.inputs, input => {
              input.additionalParameter[index].field = parameter.field;
            }).then(() => {
              return true;
            });
            // console.log('Found but Name changed');
          }

        }
        // Nicht vorhanden -> Dies muss dazu
        else {
          // console.log('Not Found');
          addedParameter += 1;
          return await asyncForEach(this.inputs, input => {
            input.additionalParameter.push(parameter);
          }).then(() => {
            // console.log('adding succesful');
            return true;
          });
        }
      }).then(() => {
        // console.log(this.inputs);
        asyncForEach(this.inputs[0].additionalParameter, async (additionalParameter, index) => {
          if (this.customizedParameters.find(o => {
            if (o.internID === additionalParameter.internID) { return true; }
          })) {
            // console.log('Found');
          }
          else {
            return await asyncForEach(this.inputs, (input, indexInput) => {
              this.inputs[indexInput].additionalParameter.splice(index, 1);
              // console.log(this.inputs[indexInput].additionalParameter);
            }).then(() => {
              deletedParameter += 1;
              // console.log('deleting succesful');
              return true;
            });
          }
        }).then(() => {
          this.api.saveMultipleInput(this.inputs).then(res => {
            // @ts-ignore
            this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: res.modified + ' Inputs saved', life: 10000 });
            this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: deletedParameter + ' Parameters deleted', life: 10000 });
            this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: modifiedParameter + ' Parameters modified', life: 10000 });
            this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: addedParameter + ' Parameters added', life: 10000 });
            this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: keepParameter + ' Parameters stay the same', life: 10000 });
            this.platform.app.closeSpinner();
          });
        });

        // if (res) {
        //   console.log('Iteration über customizedParameters erfolgreich');
        // }
      });
    }, 1500);
  }

  public saveCustomizedParameter() {
    let customizedParameters = [...this.customizedParameters];
    if (this.newCustomizedParameter)
      customizedParameters.push(this.customizedParameter);
    else
      customizedParameters[this.customizedParameters.indexOf(this.selectedCustomizedParameter)] = this.customizedParameter;

    this.customizedParameters = customizedParameters;
    this.customizedParameter = null;
    this.displayDialogCustomizedParameter = false;
  }

  public deleteCustomizedParameter() {
    let index = this.customizedParameters.indexOf(this.selectedCustomizedParameter);
    this.customizedParameters = this.customizedParameters.filter((val, i) => i != index);
    this.customizedParameter = null;
    this.displayDialogCustomizedParameter = false;
  }

  public onRowSelectCustomizedParameter(event) {
    this.newCustomizedParameter = false;
    this.customizedParameter = this.cloneCustomizedParameter(event.data);
    this.displayDialogCustomizedParameter = true;
  }

  public cloneCustomizedParameter(c: CustomizedParameter): CustomizedParameter {
    let customizedParameter = new CustomizedParameter('generic');
    customizedParameter.internID = this.makeid(20);
    // tslint:disable-next-line: forin
    for (let prop in c) {
      customizedParameter[prop] = c[prop];
    }
    return customizedParameter;
  }

  public addModel() {
    // tslint:disable-next-line: max-line-length
    var urn = 'urn:adsk.viewing:fs.file:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE5LTEwLTI5LTE0LTI2LTQ3LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL1VOT0dfQV9GRUxfTlBCX0VYRV9EUlZfTlczQS4xLkNBVFBhcnQ/output/1/UNOG_A_FEL_NPB_EXE_DRV_NW3A.1.svf';
    this.viewerComponent.viewer.loadModel(urn, {}, (model: Autodesk.Viewing.Model) => {
      console.log(model);
    }, (errorCode: number, errorMessage: string, errorArgs: any) => {
      console.log(errorMessage);
    });
  }

  public test() {
    // // this.viewerComponent.viewer.getExtension('Autodesk.Snapping').load();
    // this.viewerComponent.viewer.toolController.activateTool('Autodesk.Snapping');
    // console.log(this.viewerComponent.viewer.toolController.getToolNames());
    // // @ts-ignore
    // console.log(this.viewerComponent.viewer.toolController.getDefaultTool());

    // this.viewerComponent.viewer.getExtension('Autodesk.Snapping', (snapper) => {
    //   this.viewerComponent.viewer.toolController.registerTool(snapper);
    //   this.viewerComponent.viewer.toolController.activateTool('snapper');

    // });

    // console.log(this.viewerComponent.viewer.isExtensionActive('Autodesk.Snapping', ''));
    // // const fragList = this.viewerComponent.viewer.model.getFragmentList();
    // // const colorMap = fragList.db2ThemingColor;
    // // console.log(fragList);
    // // console.log(colorMap);
    // // colorMap.forEach((color, index) => {
    // //   this.viewerComponent.viewer.setThemingColor(index, color);
    // // });

  }

  public onMouseMove(event) {

  }

  public showValuesOfParameter(parameter: string) {
    // löschen des Panels
    if (this.panel) {
      this.panel.container.remove();
    }
    switch (parameter) {
      case 'facade':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              res = res.map(String);
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'lot':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'u':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'v':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'elevation':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'type':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              res = res.map(String);
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'archtype':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              res = res.map(String);
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'instance':
        var valuesOfParameter: any[];
        if (this.booleanSubtypeInsteadOfInstance) {
          this.api.getvaluesOfParameter('subtype', this.platform.currentProject._id).then(
            res => {
              if (res === null) {
                this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
              }
              else {
                // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
                res = res.map(String);
                this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
                valuesOfParameter = res;
                if (this.selectedFacadeEnabled) {
                  this.loadIconMarkupExtension(parameter);
                }
                else {
                  this.showLegend(parameter, valuesOfParameter, false);
                }
              }
            }
          );
        }
        else {
          this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
            res => {
              if (res === null) {
                this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
              }
              else {
                // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
                res = res.map(String);
                this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
                valuesOfParameter = res;
                if (this.selectedFacadeEnabled) {
                  this.loadIconMarkupExtension(parameter);
                }
                else {
                  this.showLegend(parameter, valuesOfParameter, false);
                }
              }
            }
          );
        }
        break;
      case 'opened':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              res = res.map(Boolean);
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'lengthAB':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'lengthBC':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'lengthCD':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'lengthDA':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      case 'area':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              // res = res.map(Number); -> Bei Number Wert wahrscheinlich nicht da NULL verloren geht
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;

      // Project Managment Parameter
      case 'status':
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              res = res.map(String);
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, false);
              }
            }
          }
        );
        break;
      default:
        console.log('additional Parameter');
        var valuesOfParameter: any[];
        // Here we are
        this.api.getValuesOfAdditionalParameter(parameter, this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              // Dies braucht es weil in Datenbank nicht konsistent => type: string/number
              this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: 'VALUES ARE AVAILABLE' });
              valuesOfParameter = res;
              if (this.selectedFacadeEnabled) {
                this.loadIconMarkupExtension(parameter);
              }
              else {
                this.showLegend(parameter, valuesOfParameter, true);
              }
            }
          }
        );
    }
  }

  public loadMobileToolbar() {
    /////////////////////// Facade & U-Value ///////////////////////
    var button1 = new Autodesk.Viewing.UI.Button('mobile-text-button-facade');
    var button2 = new Autodesk.Viewing.UI.Button('mobile-coloring');
    var buttonStatus = new Autodesk.Viewing.UI.Button('mobile-text-button-status');
    var buttonStatus2 = new Autodesk.Viewing.UI.Button('mobile-coloring');
    var button7 = new Autodesk.Viewing.UI.Button('mobile-text-button-u');
    var button8 = new Autodesk.Viewing.UI.Button('mobile-coloring');

    //@ts-ignore
    var filterbox = new Autodesk.Viewing.UI.Filterbox('mobile-filterbox', { filterFunction: this.testing });
    var buttonFilter = new Autodesk.Viewing.UI.Button('mobile-coloring');
    var buttonFilterCount = new Autodesk.Viewing.UI.Button('mobile-button-counter');

    button1.onClick = (event) => {
      if ($('#mobile-custom-toolbar-input').is(':visible') && this.whichInput === 'facade') {
        button1.setState(1);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.whichInput === '') {
        button1.setState(0);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').show();
        this.whichInput = 'facade';
      }
    };

    button2.onClick = (event) => {
      this.showValuesOfParameter('facade');
    };

    buttonStatus.onClick = (event) => {
      if ($('#mobile-custom-toolbar-input').is(':visible') && this.whichInput === 'status') {
        buttonStatus.setState(1);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.whichInput === '') {
        buttonStatus.setState(0);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').show();
        this.whichInput = 'status';
      }
    };

    buttonStatus2.onClick = (event) => {
      this.showValuesOfParameter('status');
    };

    buttonFilter.onClick = (event) => {
      if (!this.input.objectPath && this.viewerComponent.viewer.getSelectionCount() === 0) {
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        button1.setState(1);
        buttonStatus.setState(1);
        button7.setState(1);
        // tslint:disable-next-line: no-use-before-declare
        button3.setState(1);
        // tslint:disable-next-line: no-use-before-declare
        button9.setState(1);
        // tslint:disable-next-line: no-use-before-declare
        button5.setState(1);
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.viewerComponent.viewer.getSelectionCount() > 1 && this.redSelectedDbIDs.length === 0) {
        this.multiSelectedMobileInput.forEach(input => {
          if (this.whichInput === 'u' || this.whichInput === 'v') {
            input[this.whichInput] = Number($('.filter-box.docking-panel-delimiter-shadow').val());
          }
          else if (this.whichInput === 'additionalParameter') {
            input[this.whichInput][0].value = $('.filter-box.docking-panel-delimiter-shadow').val();
          }
          else {
            input[this.whichInput] = $('.filter-box.docking-panel-delimiter-shadow').val();
          }
        });
        this.api.saveMultipleInput(this.multiSelectedMobileInput).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with SAVING' });
            }
            else {
              this.api.getAllInputs(this.platform.currentProject._id).then(
                inputs => {
                  this.inputs = inputs;
                  // @ts-ignore
                  this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: res.modified + ' INPUT was UPDATED', life: 5000 });
                  this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
                  this.editTable = false;
                  this.unsavedChanged = false;
                }
              );
            }
          }
        );
        this.multiSelectedMobileInput = new Array();
        this.viewerComponent.viewer.clearSelection();
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        button1.setState(1);
        buttonStatus.setState(1);
        button7.setState(1);
        // tslint:disable-next-line: no-use-before-declare
        button3.setState(1);
        // tslint:disable-next-line: no-use-before-declare
        button9.setState(1);
        // tslint:disable-next-line: no-use-before-declare
        button5.setState(1);
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.redSelectedDbIDs.length !== 0) {
        this.redSelectedDbIDs.forEach(dbId => {
          this.viewerComponent.viewer.model.getProperties(dbId, (r) => {
            var tempInput = this.inputs.find(ele => {
              if (ele.objectPath.indexOf('/')) {
                return ele.objectPath.split('/')[ele.objectPath.split('/').length - 1] === r.name;
              }
              else {
                return ele.objectPath === r.name;
              }
            });
            this.multiSelectedMobileInput.push(tempInput);
          });
        });
        setTimeout(() => {
          this.multiSelectedMobileInput.forEach(input => {
            if (this.whichInput === 'u' || this.whichInput === 'v') {
              input[this.whichInput] = Number($('.filter-box.docking-panel-delimiter-shadow').val());
            }
            else if (this.whichInput === 'additionalParameter') {
              input[this.whichInput][0].value = $('.filter-box.docking-panel-delimiter-shadow').val();
            }
            else {
              input[this.whichInput] = $('.filter-box.docking-panel-delimiter-shadow').val();
            }
          });
          this.api.saveMultipleInput(this.multiSelectedMobileInput).then(
            res => {
              if (res === null) {
                this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with SAVING' });
              }
              else {
                this.api.getAllInputs(this.platform.currentProject._id).then(
                  inputs => {
                    this.inputs = inputs;
                    // @ts-ignore
                    this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: res.modified + ' INPUT was UPDATED', life: 5000 });
                    this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
                    this.editTable = false;
                    this.unsavedChanged = false;
                  }
                );
              }
            }
          );
          this.multiSelectedMobileInput = new Array();
          this.viewerComponent.viewer.clearSelection();
          $('.filter-box.docking-panel-delimiter-shadow').val('');
          button1.setState(1);
          buttonStatus.setState(1);
          button7.setState(1);
          // tslint:disable-next-line: no-use-before-declare
          button3.setState(1);
          // tslint:disable-next-line: no-use-before-declare
          button9.setState(1);
          // tslint:disable-next-line: no-use-before-declare
          button5.setState(1);
          $('#mobile-custom-toolbar-input').hide();
          this.whichInput = '';
        }, 2000);
      }
      else {
        // console.log(this.input.objectPath);
        // console.log($('.filter-box.docking-panel-delimiter-shadow').val());
        if (this.whichInput === 'u' || this.whichInput === 'v') {
          this.input[this.whichInput] = Number($('.filter-box.docking-panel-delimiter-shadow').val());
        }
        else if (this.whichInput === 'additionalParameter') {
          this.input[this.whichInput][0].value = $('.filter-box.docking-panel-delimiter-shadow').val();
        }
        else {
          this.input[this.whichInput] = $('.filter-box.docking-panel-delimiter-shadow').val();
        }
        this.onSave(this.input).then(() => {
          $('.filter-box.docking-panel-delimiter-shadow').val('');
          $('#mobile-custom-toolbar-input').hide();
          this.whichInput = '';
          button1.setState(1);
          buttonStatus.setState(1);
          button7.setState(1);
          // tslint:disable-next-line: no-use-before-declare
          button3.setState(1);
          // tslint:disable-next-line: no-use-before-declare
          button9.setState(1);
          // tslint:disable-next-line: no-use-before-declare
          button5.setState(1);
        });
        this.viewerComponent.viewer.clearSelection();
      }
    };

    button8.onClick = (event) => {
      this.showValuesOfParameter('u');
    };

    button7.onClick = (event) => {
      if ($('#mobile-custom-toolbar-input').is(':visible') && this.whichInput === 'u') {
        button7.setState(1);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.whichInput === '') {
        button7.setState(0);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').show();
        this.whichInput = 'u';
      }
    };

    button2.addClass('mobile-coloring');
    buttonStatus2.addClass('mobile-coloring');
    button7.addClass('mobile-coloring');
    // @ts-ignore
    button2.container.children[0].classList.add('fas', 'fa-palette');
    // @ts-ignore
    buttonStatus2.container.children[0].classList.add('fas', 'fa-palette');
    // @ts-ignore
    button8.container.children[0].classList.add('fas', 'fa-palette');
    // @ts-ignore
    buttonFilter.container.children[0].classList.add('fas', 'fa-check');

    // Button 1 Textfeld
    button1.addClass('mobile-text-button-facade');
    // Button 1 Textfeld
    buttonStatus.addClass('mobile-text-button-facade');
    // Button 7 Textfeld
    button7.addClass('mobile-text-button-u');
    // Button Counter
    buttonFilterCount.addClass('mobile-button-counter');
    // SubToolbar
    var controlGroupMobile = new Autodesk.Viewing.UI.ControlGroup('mobile-custom-toolbar');
    // SubToolbar
    var controlGroupMobileStatus = new Autodesk.Viewing.UI.ControlGroup('mobile-custom-toolbar-status');
    // SubToolbar Status
    var controlGroupMobileBottom = new Autodesk.Viewing.UI.ControlGroup('mobile-custom-toolbar-bottom');
    // SubToolbar
    var controlGroupMobileInput = new Autodesk.Viewing.UI.ControlGroup('mobile-custom-toolbar-input');

    controlGroupMobile.addControl(button1);
    controlGroupMobile.addControl(button2);
    controlGroupMobileStatus.addControl(buttonStatus);
    controlGroupMobileStatus.addControl(buttonStatus2);
    controlGroupMobileBottom.addControl(button7);
    controlGroupMobileBottom.addControl(button8);
    controlGroupMobileInput.addControl(filterbox);
    controlGroupMobileInput.addControl(buttonFilterCount);
    controlGroupMobileInput.addControl(buttonFilter);

    this.toolbarMobile = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-mobile-facade', { collapsible: false, alignVertically: false });
    this.toolbarMobile.addControl(controlGroupMobile);
    this.toolbarMobile.addControl(controlGroupMobileBottom);
    this.toolbarMobile.addControl(controlGroupMobileStatus);
    this.toolbarMobile.addControl(controlGroupMobileInput);


    $(this.viewerComponent.viewer.container)[0].append(this.toolbarMobile.container);
    $('#mobile-text-button-facade').attr('data-before', 'Facade');
    $('#mobile-text-button-status').attr('data-before', 'Status');
    $('#mobile-text-button-u').attr('data-before', 'U');
    $('#mobile-button-counter').attr('data-before', '0');

    // Hide Input
    $('#mobile-custom-toolbar-input').hide();

    /////////////////////// Type & V-Value ///////////////////////
    var button3 = new Autodesk.Viewing.UI.Button('mobile-text-button-type');
    var button4 = new Autodesk.Viewing.UI.Button('mobile-coloring');

    var button9 = new Autodesk.Viewing.UI.Button('mobile-text-button-v');
    var button10 = new Autodesk.Viewing.UI.Button('mobile-coloring');

    button4.onClick = (event) => {
      this.showValuesOfParameter('type');
    };

    button10.onClick = (event) => {
      this.showValuesOfParameter('v');
    };

    button3.onClick = (event) => {
      if ($('#mobile-custom-toolbar-input').is(':visible') && this.whichInput === 'type') {
        button3.setState(1);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.whichInput === '') {
        button3.setState(0);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').show();
        this.whichInput = 'type';
      }
    };

    button9.onClick = (event) => {
      if ($('#mobile-custom-toolbar-input').is(':visible') && this.whichInput === 'v') {
        button9.setState(1);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.whichInput === '') {
        button9.setState(0);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').show();
        this.whichInput = 'v';
      }
    };

    button4.addClass('mobile-coloring');
    button10.addClass('mobile-coloring');
    // @ts-ignore
    button4.container.children[0].classList.add('fas', 'fa-palette');
    // @ts-ignore
    button10.container.children[0].classList.add('fas', 'fa-palette');

    // Button 4 Textfeld
    button3.addClass('mobile-text-button-type');
    // Button 4 Textfeld
    button9.addClass('mobile-text-button-v');

    // SubToolbar
    var controlGroupMobile = new Autodesk.Viewing.UI.ControlGroup('mobile-custom-toolbar');
    var controlGroupMobileBottom = new Autodesk.Viewing.UI.ControlGroup('mobile-custom-toolbar-bottom');


    controlGroupMobile.addControl(button3);
    controlGroupMobile.addControl(button4);
    controlGroupMobileBottom.addControl(button9);
    controlGroupMobileBottom.addControl(button10);

    this.toolbarMobile = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-mobile-type', { collapsible: false, alignVertically: false });
    this.toolbarMobile.addControl(controlGroupMobile);
    this.toolbarMobile.addControl(controlGroupMobileBottom);

    $(this.viewerComponent.viewer.container).append(this.toolbarMobile.container);
    $('#mobile-text-button-type').attr('data-before', 'Type');
    $('#mobile-text-button-v').attr('data-before', 'V');

    /////////////////////// Instance & Additional Parameter ///////////////////////
    var button5 = new Autodesk.Viewing.UI.Button('mobile-text-button-instance');
    var button6 = new Autodesk.Viewing.UI.Button('mobile-coloring');

    var button11 = new Autodesk.Viewing.UI.Button('mobile-text-button-additionalParameter');
    var button12 = new Autodesk.Viewing.UI.Button('mobile-coloring');

    button6.onClick = (event) => {
      this.showValuesOfParameter('instance');
    };
    button6.addClass('mobile-coloring');

    button12.onClick = (event) => {
      this.showValuesOfParameter(this.firstAdditionalparameter.field);
    };
    button12.addClass('mobile-coloring');

    // @ts-ignore
    button6.container.children[0].classList.add('fas', 'fa-palette');
    // @ts-ignore
    button12.container.children[0].classList.add('fas', 'fa-palette');

    button5.onClick = (event) => {
      if ($('#mobile-custom-toolbar-input').is(':visible') && this.whichInput === 'instance') {
        button5.setState(1);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.whichInput === '') {
        button5.setState(0);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').show();
        this.whichInput = 'instance';
      }
    };

    button11.onClick = (event) => {
      if ($('#mobile-custom-toolbar-input').is(':visible') && this.whichInput === 'additionalParameter') {
        button11.setState(1);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').hide();
        this.whichInput = '';
      }
      else if (this.whichInput === '') {
        button11.setState(0);
        $('.filter-box.docking-panel-delimiter-shadow').val('');
        $('#mobile-custom-toolbar-input').show();
        this.whichInput = 'additionalParameter';
      }
    };

    // Button 5 Textfeld
    button5.addClass('mobile-text-button-instance');
    button11.addClass('mobile-text-button-additionalParameter');
    // SubToolbar
    var controlGroupMobile = new Autodesk.Viewing.UI.ControlGroup('mobile-custom-toolbar');
    var controlGroupMobileBottom = new Autodesk.Viewing.UI.ControlGroup('mobile-custom-toolbar-bottom');

    controlGroupMobile.addControl(button5);
    controlGroupMobile.addControl(button6);
    controlGroupMobileBottom.addControl(button11);
    controlGroupMobileBottom.addControl(button12);

    this.toolbarMobile = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-mobile-additionalParameter', { collapsible: false, alignVertically: false });
    this.toolbarMobile.addControl(controlGroupMobile);
    this.toolbarMobile.addControl(controlGroupMobileBottom);

    $(this.viewerComponent.viewer.container).append(this.toolbarMobile.container);
    $('#mobile-text-button-instance').attr('data-before', 'Instance');
    setTimeout(() => {
      $('#mobile-text-button-additionalParameter').attr('data-before', this.firstAdditionalparameter.field);
    }, 3000);
  }

  public loadCustomToolbar() {
    // Button 1
    var button1 = new Autodesk.Viewing.UI.Button('multiselect-button');
    button1.onClick = (event) => {
      if (this.redSelectedDbIDs.length === 0) {
        this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'There are no Red colored / Searched Panels' });
      }
      else {
        this.viewerComponent.viewer.select(this.redSelectedDbIDs, this.viewerComponent.viewer.model);
        this.panel.setVisible(false);
      }
    };
    button1.addClass('multiselect-button');
    button1.setToolTip('Multiselect the red ones');
    button1.setIcon('adsk-icon-plus');

    // @ts-ignore
    // var filterbox = new Autodesk.Viewing.UI.Filterbox('multiselect-button-list-length');

    // Button 2
    var button2 = new Autodesk.Viewing.UI.Button('multiselect-button-list-length');
    button2.onClick = (event) => {
      console.log('this.redSelectedDbIDs');
      console.log(this.redSelectedDbIDs);
      console.log('this.viewerComponent.viewer.getSelection()');
      console.log(this.viewerComponent.viewer.getSelection());
    };
    button2.addClass('multiselect-button-list-length');
    button2.setToolTip('How many Panels are still in the selected List');

    // Button 3 enable Multiselect
    if (this.isMobile) {
      var button3 = new Autodesk.Viewing.UI.Button('enable-multiselect');
      // @ts-ignore
      const standard = this.viewerComponent.viewer.clickHandler.handleSingleTap;
      button3.onClick = (event) => {
        // @ts-ignore
        this.viewerComponent.viewer.clearSelection();
        if (button3.getState() === 1) {
          button3.setState(0);
          // @ts-ignore
          this.viewerComponent.viewer.clickHandler.handleSingleTap = (tabEvent) => {
            const result = this.viewerComponent.viewer.impl.hitTestViewport(this.viewerComponent.viewer.impl.clientToViewport(tabEvent.canvasX, tabEvent.canvasY), false);
            if (result) {
              // console.log(result);
              this.viewerComponent.viewer.toggleSelect(result.dbId, result.model, 0);
              this.viewerComponent.viewer.model.getProperties(result.dbId, (r) => {
                var tempInput = this.inputs.find(ele => {
                  if (ele.objectPath.indexOf('/')) {
                    return ele.objectPath.split('/')[ele.objectPath.split('/').length - 1] === r.name;
                  }
                  else {
                    return ele.objectPath === r.name;
                  }
                });
                this.multiSelectedMobileInput.push(tempInput);
                $('#mobile-text-button-facade').attr('data-before', 'Facade');
                $('#mobile-text-button-type').attr('data-before', 'Type');
                $('#mobile-text-button-additionalParameter').attr('data-before', this.firstAdditionalparameter.field);
                $('#mobile-text-button-u').attr('data-before', 'U');
                $('#mobile-text-button-v').attr('data-before', 'V');
              });
              // console.log(this.multiSelectedMobileInput);
            } else {
              this.multiSelectedMobileInput = new Array();
              this.viewerComponent.viewer.clearSelection();
            }
            return true;
          };
        }
        else {
          button3.setState(1);
          this.multiSelectedMobileInput = new Array();
          this.viewerComponent.viewer.clearSelection();
          // @ts-ignore
          this.viewerComponent.viewer.clickHandler.handleSingleTap = standard;
        }
      };
      button3.addClass('multiselect-button');
      button3.setIcon('adsk-icon-roll');
    }

    // SubToolbar
    var controlGroup = new Autodesk.Viewing.UI.ControlGroup('my-custom-toolbar');
    controlGroup.addControl(button1);
    controlGroup.addControl(button2);
    // controlGroup.addControl(filterbox);

    if (this.isMobile) {
      controlGroup.addControl(button3);
    }

    this.toolbarMultiSelect = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-multiselect', { collapsible: false, alignVertically: true });
    this.toolbarMultiSelect.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(this.toolbarMultiSelect.container);
    $('#multiselect-button-list-length').attr('data-before', 0);

    // ERP Modus einschalten
    if (!this.isMobile) {
      // Button 3 ERP Modus
      // var button3 = new Autodesk.Viewing.UI.Button('erp-mode-button');
      var button4 = new Autodesk.Viewing.UI.Button('erp-text-button');
      var button5 = new Autodesk.Viewing.UI.Button('erp-differentiate-types');
      var button6 = new Autodesk.Viewing.UI.Button('erp-coloring-clearing');
      button5.setState(2);
      button6.setState(2);
      button4.setToolTip('Activate the ERP Mode');
      button4.onClick = (event) => {
        // button3.onClick = (event) => {
        // Das war vorher button4
        if (!this.erpMode) {
          this.selectedERPObject = new ERPObject('generic');
          this.erpMode = !this.erpMode;
          button4.setState(0);
          button5.setState(1);
          button6.setState(1);
          $('#erp-text-button').css('background-color', '#FE3123');
          this.messageService.add({ key: 'warning', severity: 'success', summary: 'ERP Mode', detail: 'ERP Mode activated' });
        }
        else {
          this.erpMode = !this.erpMode;
          button4.setState(1);
          $('#erp-text-button').css('background-color', '#A80000');
          // Die beiden Button disabled schalten und Farbe ändern
          button5.setState(2);
          $('#erp-differentiate-types').css('background-color', '#A80000');
          this.differentiateTypesMode = false;
          // Coloring Clearing
          button6.setState(2);
          $('#erp-coloring-clearing').css('background-color', '#A80000');
          // Message noch herausgeben und Hilfsarray leeren
          this.messageService.add({ key: 'warning', severity: 'warn', summary: 'ERP Mode', detail: 'ERP Mode disabled' });
          this.coloringClearing = true;
          this.colorMap = null;
          this.colorMapBoolean = false;
          this.keepColorArray = null;
        }
      };
      button5.onClick = (event) => {
        if (this.erpMode) {
          if (!this.differentiateTypesMode) {
            button5.setState(0);
            $('#erp-differentiate-types').css('background-color', '#FE3123');
            this.differentiateTypesMode = !this.differentiateTypesMode;
            this.messageService.add({ key: 'warning', severity: 'success', summary: 'ERP Mode', detail: 'Differentiating types in lot activated' });
          }
          else {
            button5.setState(1);
            $('#erp-differentiate-types').css('background-color', '#A80000');
            this.differentiateTypesMode = !this.differentiateTypesMode;
            this.messageService.add({ key: 'warning', severity: 'warn', summary: 'ERP Mode', detail: 'Differentiating types in lot disabled' });
          }
        }
      };
      button6.onClick = (event) => {
        if (this.erpMode) {
          if (this.coloringClearing) {
            button6.setState(0);
            $('#erp-coloring-clearing').css('background-color', '#FE3123');
            this.coloringClearing = !this.coloringClearing;
            this.messageService.add({ key: 'warning', severity: 'success', summary: 'ERP Mode', detail: 'Coloring Clearing Disabled' });
          }
          else {
            button6.setState(1);
            $('#erp-coloring-clearing').css('background-color', '#A80000');
            this.coloringClearing = !this.coloringClearing;
            this.colorMap = null;
            this.colorMapBoolean = false;
            this.keepColorArray = null;
            this.messageService.add({ key: 'warning', severity: 'warn', summary: 'ERP Mode', detail: 'Coloring Clearing Activated' });
          }
        }
      };
      // button3.addClass('erp-mode-button');
      // button3.setToolTip('Activate the ERP Mode');
      // button3.setIcon('adsk-icon-structure');
      button5.addClass('erp-differentiate-types');
      button5.setToolTip('Activate the Differentiation of Types within the Lot');
      button5.setIcon('adsk-icon-mem-mgr');
      button6.addClass('erp-coloring-clearing');
      button6.setToolTip('Disable Coloring Clearing');
      button6.setIcon('adsk-icon-measure-trash');

      // @ts-ignore
      var filterboxERP = new Autodesk.Viewing.UI.Filterbox('erp-text-button');

      // Button 4 ERP
      // var button4 = new Autodesk.Viewing.UI.Button('erp-text-button');
      // button4.onClick = (event) => { };
      button4.addClass('erp-text-button');
      // SubToolbar
      var controlGroupERP = new Autodesk.Viewing.UI.ControlGroup('erp-custom-toolbar');
      // controlGroupERP.addControl(button3);
      controlGroupERP.addControl(button4);
      controlGroupERP.addControl(button5);
      controlGroupERP.addControl(button6);
      controlGroupERP.addControl(filterboxERP);

      this.toolbarERP = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-erp', { collapsible: false, alignVertically: false });
      this.toolbarERP.addControl(controlGroupERP);

      $(this.viewerComponent.viewer.container).append(this.toolbarERP.container);
      $('#erp-text-button').attr('data-before', 'Activate ERP Mode');
    }
  }

  public loadFacadeToolbar() {
    // Button 1
    var button1 = new Autodesk.Viewing.UI.Button('showing-panel');
    button1.addClass('showing-panel');
    // @ts-ignore
    button1.container.children[0].classList.add('fas', 'fa-solar-panel');
    // SubToolbar
    var controlGroup = new Autodesk.Viewing.UI.ControlGroup('my-custom-toolbar-facade');
    controlGroup.addControl(button1);
    // Toolbar
    this.toolbarFacade = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-facade', { collapsible: false, alignVertically: true });
    button1.onClick = (event) => {
      if (button1.getState() === 1) {
        $('#showing-panel').css('background-color', '#FE3123');
        button1.setState(0);
        this.selectedFacadeEnabled = true;
        this.messageService.add({ key: 'warning', severity: 'success', summary: 'ERP Mode', detail: 'Showing facades activated' });

        // this.showValuesOfParameter('facade');
        var valuesOfParameter: any[];
        this.api.getvaluesOfParameter('facade', this.platform.currentProject._id).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with GETTING VALUES' });
            }
            else {
              valuesOfParameter = res;
              // console.log('valuesOfParameter');
              // console.log(valuesOfParameter);
              valuesOfParameter.forEach(valueOfParameter => {
                if (!valueOfParameter) {
                  valueOfParameter = 'null';
                }
                // Es werden alle Whitespaces gelöscht
                valueOfParameter = valueOfParameter.replace(/ /g, '');

                // Braucht einen Anhang an jede Klasse, da CSS Klasse nicht mit [0-9] beginnen kann
                var annexClass = 'Class_';

                // iterative Button
                var buttonIterativ = new Autodesk.Viewing.UI.Button(annexClass + valueOfParameter);

                // Click Event !! Important !!
                buttonIterativ.onClick = () => {
                  if (buttonIterativ.getState() === 1) {
                    $('#' + annexClass + valueOfParameter).css('background-color', '#FE3123');
                    buttonIterativ.setState(0);
                    this.valueOfParameterFacadeArray.push({
                      [valueOfParameter]: this.inputs.filter(element => {
                        return element.facade === valueOfParameter;
                      })
                    }
                    );
                  }
                  else {
                    buttonIterativ.setState(1);
                    this.viewerComponent.viewer.unloadExtension('IconMarkupExtension');
                    $('#' + annexClass + valueOfParameter).css('background-color', '#A80000');
                    this.valueOfParameterFacadeArray.forEach((element, index) => {
                      if (Object.keys(element)[0] === valueOfParameter) {
                        this.valueOfParameterFacadeArray.splice(index, 1);
                      }
                    });
                  }
                };

                buttonIterativ.addClass(annexClass + valueOfParameter);
                controlGroup.addControl(buttonIterativ);
                // tslint:disable-next-line: max-line-length
                $('#' + annexClass + valueOfParameter).append('<style>.' + annexClass + valueOfParameter + ':before{content: attr(data-before); font-size: 20px; color: white;}</style>');
                $('#' + annexClass + valueOfParameter).append('<style>.' + annexClass + valueOfParameter + '{width: 38px !important}</style>');
                $('#' + annexClass + valueOfParameter).append('<style>.' + annexClass + valueOfParameter + '{animation: slideMe .7s ease-in;}</style>');
                $('#' + annexClass + valueOfParameter.toString()).attr('data-before', valueOfParameter);
              });
            }
          }
        );
      }
      else {
        button1.setState(1);
        this.selectedFacadeEnabled = false;
        $('#showing-panel').css('background-color', '#A80000');
        // this.panel.setVisible(false);
        this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
        this.messageService.add({ key: 'warning', severity: 'warn', summary: 'ERP Mode', detail: 'Showing facades disabled' });

        while (controlGroup.getNumberOfControls() > 1) {
          var tempID = controlGroup.getControlId(1);
          controlGroup.removeControl(tempID);
        }
        this.viewerComponent.viewer.unloadExtension('IconMarkupExtension');
      }
    };
    this.toolbarFacade.addControl(controlGroup);
    $(this.viewerComponent.viewer.container).append(this.toolbarFacade.container);
  }

  public loadSectionToolbar() {
    // Section Modus einschalten
    // var button1 = new Autodesk.Viewing.UI.Button('section-mode-button');
    var button2 = new Autodesk.Viewing.UI.Button('section-text-button');
    var button3 = new Autodesk.Viewing.UI.Button('section-hoover-coloring');
    var button4 = new Autodesk.Viewing.UI.Button('section-show-markups');
    var button5 = new Autodesk.Viewing.UI.Button('section-change-view');
    var button6 = new Autodesk.Viewing.UI.Button('section-rotate-view');
    button3.setState(2);
    button4.setState(2);
    button5.setState(2);
    button6.setState(2);

    button2.onClick = (event) => {
      // button1.onClick = (event) => {
      if (!this.sectionMode) {
        this.sectionMode = !this.sectionMode;
        button2.setState(0);
        button3.setState(1);
        $('#section-text-button').css('background-color', '#FE3123');
        button4.setState(0);
        $('#section-show-markups').css('background-color', '#FE3123');
        // @ts-ignore
        button4.container.children[0].classList.remove('fas', 'fa-eye-slash');
        // @ts-ignore
        button4.container.children[0].classList.add('fas', 'fa-eye');
        button5.setState(1);
        button6.setState(1);

        this.messageService.add({ key: 'warning', severity: 'success', summary: 'Section Mode', detail: 'Section Mode activated' });
        this.viewerComponent.viewer.loadExtension('SectionExtension', {
          // Hier alle bestehenden Section übergeben
          _platform: this.platform,
          _messageService: this.messageService,
          _api: this.api,
          _editingComponent: this,
          // Testing **************************************************************************
          _componentFactoryResolver: this.componentFactoryResolver,
          // _viewContainerRef: this.viewContainerRef
          // Testing **************************************************************************
        });

      }
      else {
        this.sectionMode = !this.sectionMode;
        button2.setState(1);
        $('#section-text-button').css('background-color', '#A80000');
        // Die beiden Button disabled schalten und Farbe ändern
        button3.setState(2);
        $('#section-hoover-coloring').css('background-color', '#A80000');
        this.differentiateTypesMode = false;
        button4.setState(2);
        $('#section-show-markups').css('background-color', '#A80000');
        // @ts-ignore
        button4.container.children[0].classList.remove('fas', 'fa-eye');
        // @ts-ignore
        button4.container.children[0].classList.add('fas', 'fa-eye-slash');
        $('#section-change-view').css('background-color', '#A80000');
        button5.setState(2);
        button6.setState(2);
        // Remove EventListener
        const viewerCanvas = document.getElementsByTagName('canvas')[1]; // may need to ensure [0] is the viewer canvas if multiple canvas's
        viewerCanvas.removeEventListener('click', this.clickViewEventListenerClick);

        // Message noch herausgeben und Hilfsarray leeren
        this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Section Mode', detail: 'Section Mode disabled' });
        this.viewerComponent.viewer.unloadExtension('SectionExtension');
        // @ts-ignore
        this.viewerComponent.viewer.navigation.toPerspective();
        // @ts-ignore
        this.viewerComponent.viewer.utilities.goHome();
        this.viewerComponent.viewer.showAll();
      }
    };
    button3.onClick = (event) => {
      // @ts-ignore
      if (!this.viewerComponent.viewer.getExtension('SectionExtension').coloringHoover) {
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').coloringHoover = true;
        button3.setState(0);
        $('#section-hoover-coloring').css('background-color', '#FE3123');
        this.messageService.add({ key: 'warning', severity: 'success', summary: 'Section Mode', detail: 'Coloring if Hoovering activated' });
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').enableColoringEvent();
      }
      else {
        button3.setState(1);
        $('#section-hoover-coloring').css('background-color', '#A80000');
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').coloringHoover = false;
        this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Section Mode', detail: 'Coloring if Hoovering disabled' });
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').disableColoringEvent();
      }
    };
    button4.onClick = (event) => {
      // @ts-ignore
      if (!this.viewerComponent.viewer.getExtension('SectionExtension').showingMarkupEnabled) {
        button4.setState(0);
        $('#section-show-markups').css('background-color', '#FE3123');
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').showingMarkupEnabled = true;
        this.messageService.add({ key: 'warning', severity: 'success', summary: 'Section Mode', detail: 'Showing MarkUps activated' });
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').showMarkups(true);
        // @ts-ignore
        button4.container.children[0].classList.remove('fas', 'fa-eye-slash');
        // @ts-ignore
        button4.container.children[0].classList.add('fas', 'fa-eye');
      }
      else {
        button4.setState(1);
        $('#section-show-markups').css('background-color', '#A80000');
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').showingMarkupEnabled = false;
        this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Section Mode', detail: 'Showing MarkUps disabled' });
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').showMarkups(false);
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').hideMeshes();
        // @ts-ignore
        button4.container.children[0].classList.remove('fas', 'fa-eye');
        // @ts-ignore
        button4.container.children[0].classList.add('fas', 'fa-eye-slash');
      }
    };
    button5.onClick = (event) => {
      if (button5.getState() === 1) {
        button5.setState(0);
        $('#section-change-view').css('background-color', '#FE3123');
        this.messageService.add({ key: 'warning', severity: 'success', summary: 'Section Mode', detail: 'Showing Custom View activated' });
        const viewerCanvas = document.getElementsByTagName('canvas')[1]; // may need to ensure [0] is the viewer canvas if multiple canvas's
        // Adding EventListener
        viewerCanvas.addEventListener('click', this.clickViewEventListenerClick);
        $('#my-custom-view-toolbar-section-rotation').css('visibility', 'visible');
      }
      else {
        button5.setState(1);
        $('#section-change-view').css('background-color', '#A80000');
        this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Section Mode', detail: 'Showing Custom View disabled' });
        // Remove EventListener
        const viewerCanvas = document.getElementsByTagName('canvas')[1]; // may need to ensure [0] is the viewer canvas if multiple canvas's
        viewerCanvas.removeEventListener('click', this.clickViewEventListenerClick);
        // @ts-ignore
        this.viewerComponent.viewer.navigation.toPerspective();
        // @ts-ignore
        this.viewerComponent.viewer.utilities.goHome();
        this.viewerComponent.viewer.showAll();
        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').load();
        $('#my-custom-view-toolbar-section-rotation').css('visibility', 'hidden');
      }
    };

    button6.onClick = (event) => {
      if (!this.normal) {
        this.messageService.add({ key: 'warning', severity: 'error', summary: 'Section Mode', detail: 'Not possible in this view' });
        return null;
      }
      this.messageService.add({ key: 'warning', severity: 'success', summary: 'Section Mode', detail: 'View rotated by 180°' });

      // if (this.normal.mode === 'original') {
      // console.log(this.normal);
      // console.log(this.hitTest);
      if (this.normal.mode === 'original') {
        // @ts-ignore
        var cameraPosition = new THREE.Vector3(this.hitTest.point.x - this.normal.value.x, this.hitTest.point.y - this.normal.value.y,
          this.hitTest.point.z - this.normal.value.z);
        // @ts-ignore
        var target = this.hitTest.point;
        // console.log(cameraPosition);
        this.viewerComponent.viewer.navigation.setView(cameraPosition, target);
        this.viewerComponent.viewer.fitToView(this.sameFacadedbIds, this.viewerComponent.viewer.model, false);
        this.normal.mode = 'modified';
      }
      else {
        // @ts-ignore
        var cameraPosition = new THREE.Vector3(this.hitTest.point.x + this.normal.value.x, this.hitTest.point.y + this.normal.value.y,
          this.hitTest.point.z + this.normal.value.z);
        // @ts-ignore
        var target = this.hitTest.point;
        this.viewerComponent.viewer.navigation.setView(cameraPosition, target);
        this.viewerComponent.viewer.fitToView(this.sameFacadedbIds, this.viewerComponent.viewer.model, false);
        this.normal.mode = 'original';
      }
    };

    button2.addClass('section-text-button');
    button2.setToolTip('Activate the SECTION Mode');

    button3.addClass('section-hoover-coloring');
    button3.setToolTip('Activate the Coloring of hoovering');
    button3.setIcon('adsk-icon-mem-mgr');

    button4.addClass('section-show-markups');
    button4.setToolTip('Showing Markups');
    // @ts-ignore
    button4.container.children[0].classList.add('fas', 'fa-eye-slash');

    button5.addClass('section-change-view');
    button5.setToolTip('Enabling Orthographic View');
    // @ts-ignore
    button5.container.children[0].classList.add('fas', 'fa-search-plus');

    button6.addClass('section-rotate-view');
    button6.setToolTip('Rotate View by 180°');
    // @ts-ignore
    button6.container.children[0].classList.add('fas', 'fa-sync-alt');

    // SubToolbar
    var controlGroupSection = new Autodesk.Viewing.UI.ControlGroup('section-custom-toolbar');
    var controlGroupSectionRotation = new Autodesk.Viewing.UI.ControlGroup('section-custom-toolbar-rotation');

    // controlGroupERP.addControl(button1);
    controlGroupSection.addControl(button2);
    controlGroupSection.addControl(button3);
    controlGroupSection.addControl(button4);
    controlGroupSection.addControl(button5);

    controlGroupSectionRotation.addControl(button6);


    this.toolbarERP = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-section', { collapsible: false, alignVertically: false });
    this.toolbarERP.addControl(controlGroupSection);

    this.toolbarSectionRotation = new Autodesk.Viewing.UI.ToolBar('my-custom-view-toolbar-section-rotation', { collapsible: false, alignVertically: true });
    this.toolbarSectionRotation.addControl(controlGroupSectionRotation);

    $(this.viewerComponent.viewer.container).append(this.toolbarERP.container);
    $(this.viewerComponent.viewer.container).append(this.toolbarSectionRotation.container);
    $('#section-text-button').attr('data-before', 'Activate Section Mode');

  }

  public loadIconMarkupExtension(parameter: string) {
    this.viewerComponent.viewer.unloadExtension('IconMarkupExtension');
    var filteredInputbyFacade = new Array();
    this.valueOfParameterFacadeArray.forEach((element, index) => {
      Object.values(element).forEach(value => {
        if (index === 0) {
          filteredInputbyFacade = value;
        }
        else {
          filteredInputbyFacade = filteredInputbyFacade.concat(value);
        }
      });
    });
    this.viewerComponent.viewer.loadExtension('IconMarkupExtension', {
      inputs: filteredInputbyFacade,
      clickedParameter: parameter,
    });
  }

  doNotRightClick() {
    $('.menu.docking-panel.docking-panel-container-solid-color-a').remove();
    this.messageService.add({ key: 'notRigthClick', severity: 'errors', summary: 'Viewer', detail: 'DO NOT RIGHT CLICK WHILE LOADING', life: 10000 });
    return null;
  }

  public showLegend(parameter: string, valuesOfParameter: any[], additionalParameter: boolean) {
    this.summedInputsColoring = 0;
    // Alle Objekte hidden und dann Farbe ändern
    $('.spinner').show();
    // DO NOT Rigth Click while LOADING
    this.viewerComponent.viewer.container.addEventListener('contextmenu', this.rigthClickEventListener);

    this.viewerComponent.viewer.setGhosting(false);
    this.viewerComponent.viewer.hide(this.viewerComponent.viewer.model.getRootId());

    var container = this.viewerComponent.viewer.container as HTMLElement;
    this.panel = new Autodesk.Viewing.UI.DockingPanel(container, 'parameterLegend', 'Parameter Legend: ' + parameter, { localizeTitle: true, addFooter: true });
    this.panel.setVisible(true);
    this.panel.content = document.createElement('div');
    const contentDiv = this.panel.content as HTMLElement;
    contentDiv.classList.add('container', 'border-box');
    contentDiv.style.boxSizing = 'border-box';
    $(this.panel.content).append(html);
    contentDiv.style.overflowY = 'scroll';
    contentDiv.style.height = 'calc(100% - 90px)';
    contentDiv.style.color = 'black';
    this.panel.container.classList.add('docking-panel-container-solid-color-a');
    if (this.isMobile) {
      this.panel.container.style.height = '151px';
      this.panel.container.style.bottom = '0px';
      this.panel.container.style.top = 'unset';
    }
    else {
      this.panel.container.style.height = '350px';
    }
    this.panel.container.style.width = '600px';
    this.panel.container.style.minWidth = '600px';
    this.panel.container.style.resize = 'none';

    // FOOTER ==> Orginal Grösse 20 px
    this.panel.footer.style.height = '40px';
    this.panel.footer.style.paddingLeft = '14px';
    this.panel.footer.style.paddingTop = '10px';
    var valuesDivFooter = document.createElement('div');
    valuesDivFooter.setAttribute('class', 'p-grid');
    valuesDivFooter.innerHTML = '<div class="p-col">' + 'Number of Values: ' + valuesOfParameter.length.toString() + '</div>';
    valuesDivFooter.innerHTML += '<div class="p-col-1">Sum: </div>';
    valuesDivFooter.innerHTML += '<div class="p-col-1" id="summedInputsColoring"></div>';
    valuesDivFooter.innerHTML += '<div class="p-col">' + 'Total Elements: ' + this.inputs.length.toString() + '</div>';
    this.panel.footer.append(valuesDivFooter as HTMLElement);

    this.panel.container.appendChild(this.panel.content as HTMLElement);

    var colorDivHeader = document.createElement('div');
    colorDivHeader.setAttribute('class', 'p-col-2');
    colorDivHeader.setAttribute('style', 'margin-right: 10px');
    colorDivHeader.innerHTML = '<div class="box">' + 'Color' + '</div>';
    colorDivHeader.style.color = 'black';
    $(this.panel.container).find('#legend')[0].appendChild(colorDivHeader as HTMLElement);

    // var textDivHeader = document.createElement('div');
    // textDivHeader.setAttribute('class', 'p-col-1');
    // textDivHeader.innerHTML = '<div class="box"></div>';
    // $(this.panel.container).find('#legend')[0].appendChild(textDivHeader as HTMLElement);

    var textDivHeader2 = document.createElement('div');
    textDivHeader2.setAttribute('class', 'p-col-2');
    textDivHeader2.innerHTML = '<div class="box">' + 'Value' + '</div>';
    textDivHeader2.style.color = 'red';
    $(this.panel.container).find('#legend')[0].appendChild(textDivHeader2 as HTMLElement);

    var textDivHeader3 = document.createElement('div');
    textDivHeader3.setAttribute('class', 'p-col-2');
    textDivHeader3.innerHTML = '<div class="box">' + 'Quantity' + '</div>';
    textDivHeader3.style.color = 'brown';
    $(this.panel.container).find('#legend')[0].appendChild(textDivHeader3 as HTMLElement);

    var textDivHeader4 = document.createElement('div');
    textDivHeader4.setAttribute('class', 'p-col-2');
    textDivHeader4.innerHTML = '<div class="box">' + 'Percentage' + '</div>';
    textDivHeader4.style.color = 'violet';
    $(this.panel.container).find('#legend')[0].appendChild(textDivHeader4 as HTMLElement);

    var textDivHeader5 = document.createElement('div');
    textDivHeader5.setAttribute('class', 'p-col-2');
    textDivHeader5.innerHTML = '<div class="box">' + 'Area m&sup2' + '</div>';
    textDivHeader5.style.color = 'green';
    $(this.panel.container).find('#legend')[0].appendChild(textDivHeader5 as HTMLElement);

    // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
    let tempViewerComponent = this.viewerComponent;
    $(this.panel.container).find('.docking-panel-close').click((e) => {
      tempViewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
      return false;
    });

    if (typeof valuesOfParameter[0] !== 'boolean') {
      valuesOfParameter = valuesOfParameter.sort((a, b) => a - b);
    }
    // Dies ist die Sortierung für den Parameter Status
    if (parameter === 'status') {
      valuesOfParameter = ['none', 'fabricated started', 'fabricated', 'sent', 'installed', 'broken'];
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
        var idx = this.customizedParameters.findIndex((findParameterIdx) => findParameterIdx.field === parameter);
        var coloredElements: InputObject[] = this.inputs.filter((input, index1) => {
          // console.log(input.additionalParameter[idx].value);
          // console.log(index1);
          return input.additionalParameter[idx].value === value;
        });
      }
      else {
        var coloredElements: InputObject[] = this.inputs.filter(input => {
          return input[parameter] === value;
        });
      }




      // console.log(coloredElements);

      // Farbe definieren
      let random1 = (Math.floor(Math.random() * 256));
      let random2 = (Math.floor(Math.random() * 256));
      let random3 = (Math.floor(Math.random() * 256));
      var hue = 'rgb(' + random1 + ',' + random2 + ',' + random3 + ')';

      if (parameter === 'elevation' || parameter === 'opened' || parameter === 'lengthAB') {
        hue = colors[0][index];
        if (hue === undefined) {
          // Farbe definieren
          let undefined1 = (Math.floor(Math.random() * 256));
          let undefined2 = (Math.floor(Math.random() * 256));
          let undefined3 = (Math.floor(Math.random() * 256));
          var hue = 'rgb(' + undefined1 + ',' + undefined2 + ',' + undefined3 + ')';
        }
      }
      var colorDiv = document.createElement('div');
      colorDiv.setAttribute('class', 'p-col-2');
      colorDiv.setAttribute('style', 'margin-right: 10px');
      colorDiv.setAttribute('id', index.toString() + '0');
      colorDiv.innerHTML = '<div class="box" style="background-color: ' + hue + ' ; height: 20px"></div>';
      // colorDiv.innerHTML = '<div class="box" style="background-color: ' + hue + ' ; height: 20px"><p-colorPicker [(ngModel)]="archtypecolor"></p-colorPicker></div>';
      var box = colorDiv.children[0];
      box.setAttribute('value', value);

      // Event Listeners
      box.addEventListener('mouseover', (event) => {
        var targetElement = event.target as HTMLElement;
        targetElement.style.backgroundColor = 'rgb(255, 0, 0)';
      }, false);
      box.addEventListener('mouseout', (event) => {
        var targetElement = event.target as HTMLElement;
        targetElement.style.backgroundColor = hue;
      }, false);

      // Event Listener für Click auf Farb Box
      box.addEventListener('click', (event) => {
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


        coloredElements.forEach(element => {
          // @ts-ignore
          this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.getHiddenModels()[0]);
          var name = '';
          if (element.objectPath.indexOf('/')) {
            name = element.objectPath.split('/')[element.objectPath.split('/').length - 1];
          }
          else {
            name = element.objectPath;
          }
          // let color = new THREE.Vector4(random1 / 256, random2 / 256, random3 / 256, 1);
          let color = new THREE.Vector4(256 / 256, 0 / 256, 0 / 256, 1);
          if (parameter === 'elevation' || parameter === 'opened' || parameter === 'lengthAB') {
            // color = colors[1][index];
            color = new THREE.Vector4(256 / 256, 0 / 256, 0 / 256, 1);
          }
          let dbId = this.viewerComponent.viewer.search(name, (idArray) => {
            this.viewerComponent.viewer.setThemingColor(idArray[0], color, this.viewerComponent.viewer.model, true);
            this.redSelectedDbIDs.push(idArray[0]);
          }, (err) => {
            this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something with COLORING went wrong: ' + err });
          }, ['name']);
        });
      }, false);
      $(this.panel.container).find('#legend')[0].appendChild(colorDiv as HTMLElement);

      var textDiv = document.createElement('div');
      textDiv.setAttribute('class', 'p-col-2');
      textDiv.setAttribute('id', index.toString() + '1');
      textDiv.innerHTML = '<div class="box">' + value + '</div>';
      // set style
      textDiv.style.color = 'red';
      $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

      // Abstandbox
      // var textDiv = document.createElement('div');
      // textDiv.setAttribute('class', 'p-col-1');
      // textDiv.innerHTML = '<div class="box"></div>';
      // $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

      var textDiv = document.createElement('div');
      textDiv.setAttribute('class', 'p-col-2');
      textDiv.setAttribute('id', index.toString() + '2');
      textDiv.innerHTML = '<div class="box">' + coloredElements.length + '</div>';
      // set style
      textDiv.style.color = 'brown';
      $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

      // Test
      var textDiv = document.createElement('div');
      textDiv.setAttribute('class', 'p-col-2');
      textDiv.setAttribute('id', index.toString() + '3');
      textDiv.innerHTML = '<div class="box">' + ((coloredElements.length / this.inputs.length) * 100).toFixed(3) + ' %' + '</div>';
      // set style
      textDiv.style.color = 'violet';
      $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

      // Test
      var textDiv = document.createElement('div');
      textDiv.setAttribute('class', 'p-col-2');
      textDiv.setAttribute('id', index.toString() + '4');
      var sumArea = 0;
      coloredElements.forEach((coloredElement => {
        sumArea += coloredElement.area;
      }));
      textDiv.innerHTML = '<div class="box">' + sumArea.toFixed(3) + '</div>';
      // set style
      textDiv.style.color = 'green';
      $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

      coloredElements.forEach((element, idx) => {
        this.summedInputsColoring += 1;
        var name = '';
        if (element.objectPath.indexOf('/')) {
          name = element.objectPath.split('/')[element.objectPath.split('/').length - 1];
        }
        else {
          name = element.objectPath;
        }
        let color = new THREE.Vector4(random1 / 256, random2 / 256, random3 / 256, 1);
        if (parameter === 'elevation' || parameter === 'opened' || parameter === 'lengthAB') {
          color = colors[1][index];
        }
        this.viewerComponent.viewer.search(name, (idArray) => {
          // console.log(element.instance);
          // console.log(idArray);
          this.viewerComponent.viewer.setThemingColor(idArray[0], color, this.viewerComponent.viewer.model, true);
          iterator += 1;
          // Wenn iterator gleich die Länge ist dass alle Objekte wieder zeigen
          // Korrektion für coloredElements.length !== this.inputs.length
          if (iterator === this.inputs.length - 50) {
            $('.spinner').hide();
            this.viewerComponent.viewer.showAll();
            this.viewerComponent.viewer.container.removeEventListener('contextmenu', this.rigthClickEventListener);
            this.messageService.clear();
            setTimeout(() => {
              $('#summedInputsColoring').text(this.summedInputsColoring.toString());
            }, 3000);
          }
        }, (err) => {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something with COLORING went wrong: ' + err });
        }, ['name']);
      });
    });
  }

  public showPdfPanel(fromWhere: string, input: InputObject) {
    if (input.inputId === null) {
      this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'There is NO PANEL selected', life: 5000 });
    }
    else {
      //////////////// TESTING ///////////////////////////
      if (this.pdfPanel && this.componentRef) {
        $('#pdfPanel').hide();
        $('#pdfPanel').show();
        console.log(fromWhere);
        if (fromWhere === 'quality') {
          var length = input.instance.length;
          if (length === 1) {
            var instanceNumber = '000' + input.instance;
          }
          else if (length === 2) {
            var instanceNumber = '00' + input.instance;
          }
          else if (length === 3) {
            var instanceNumber = '0' + input.instance;
          }
          else {
            var instanceNumber = input.instance;
          }
          // console.log(this.componentRef);
          this.auth.getAccessToken().then(getAccessTokenRes => {
            if (getAccessTokenRes) {
              this.api.getPDFOneDrive(this.platform.currentProject._id, 'A' + input.type + '.' + instanceNumber + '.pdf', getAccessTokenRes).subscribe(result => {
                this.componentRef.instance.srcString = result;
                setTimeout(() => {
                  this.componentRef.changeDetectorRef.detectChanges();
                }, 1000);
              });
            }
            else {
              this.messageService.add({
                key: 'warning', severity: 'error', summary: 'Error',
                detail: 'You have to be Logged in to One Drive for PDF Viewing', life: 10000
              });
            }
          });
          // this.api.getInfobyName(input.project + '_' + instanceNumber + '.pdf').then(res => {
          //   if (res) {
          //     this.api.getPdfFile(res.file.file.id).subscribe(result => {
          //       this.componentRef.instance.srcString = result;
          //     });
          //     setTimeout(() => {
          //       this.componentRef.changeDetectorRef.detectChanges();
          //     }, 1000);
          //   }
          // // Kein PDF gefunden
          // else {
          //   this.pdfPanel.setVisible(false);
          //   this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'There is NO PDF Available', life: 10000 });
          // }
          // });
        }
        else {
          this.pdfPanel.setVisible(false);
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Catalog & Plan NOT IMPLEMENTED', life: 10000 });
          // let injector = Injector.create([{
          //   provide: 'PDFInjection', useValue: { injection: true, ID: 234234 }//res.file.file.id }
          // }]);
          // let componentFactory = this.componentFactoryResolver.resolveComponentFactory(PdfComponent);
          // this.componentRef = componentFactory.create(injector, [], $('#pdfPanelInsert')[0]);
          // setTimeout(() => {
          //   this.componentRef.changeDetectorRef.detectChanges();
          // }, 500);
        }
      }
      //////////////// TESTING ///////////////////////////
      else {
        $('#pdfPanel').remove();
        var container = this.viewerComponent.viewer.container as HTMLElement;
        this.pdfPanel = new Autodesk.Viewing.UI.DockingPanel(container, 'pdfPanel', 'Showing PDF Panel', { localizeTitle: true, addFooter: true });
        this.pdfPanel.setVisible(true);
        this.pdfPanel.addVisibilityListener((show) => {
          // Logic for closing the panel
          //   if (!show) {
          //     // Muss gemacht werden, sonst geht Dynamic Component nicht
          //     $('#pdfPanel').remove();
          //   }
        });
        this.pdfPanel.content = document.createElement('div');
        const contentDiv = this.pdfPanel.content as HTMLElement;
        contentDiv.classList.add('container', 'border-box');
        contentDiv.setAttribute('id', 'pdfPanelInsert');
        contentDiv.style.boxSizing = 'border-box';
        contentDiv.style.overflowY = 'scroll';
        contentDiv.style.height = 'calc(100% - 105px)';
        contentDiv.style.color = 'black';
        this.pdfPanel.container.classList.add('docking-panel-container-solid-color-a');
        this.pdfPanel.container.style.height = '750px';
        this.pdfPanel.container.style.width = '900px';
        this.pdfPanel.container.style.minWidth = '800px';
        this.pdfPanel.container.style.resize = 'none';

        // // FOOTER ==> Orginal Grösse 20 px
        this.pdfPanel.footer.style.height = '55px';
        this.pdfPanel.footer.style.paddingLeft = '14px';
        this.pdfPanel.footer.style.paddingTop = '10px';
        var valuesDivFooter = document.createElement('div');
        valuesDivFooter.setAttribute('class', 'p-grid p-align-center');

        this.pdfPanel.footer.append(valuesDivFooter as HTMLElement);
        this.pdfPanel.container.appendChild(this.pdfPanel.content as HTMLElement);

        //////////////// TESTING ///////////////////////////
        console.log(fromWhere);
        if (fromWhere === 'quality') {
          var length = input.instance.length;
          if (length === 1) {
            var instanceNumber = '000' + input.instance;
          }
          else if (length === 2) {
            var instanceNumber = '00' + input.instance;
          }
          else if (length === 3) {
            var instanceNumber = '0' + input.instance;
          }
          else {
            var instanceNumber = input.instance;
          }
          this.auth.getAccessToken().then(getAccessTokenRes => {
            if (getAccessTokenRes) {
              this.api.getPDFOneDrive(this.platform.currentProject._id, 'A' + input.type + '.' + instanceNumber + '.pdf', getAccessTokenRes).subscribe(result => {
                let injector = Injector.create([{
                  provide: 'PDFInjection', useValue: { injection: true, sendedsrcString: result }
                }]);
                let componentFactory = this.componentFactoryResolver.resolveComponentFactory(PdfComponent);
                this.componentRef = componentFactory.create(injector, [], $('#pdfPanelInsert')[0]);
                setTimeout(() => {
                  this.componentRef.changeDetectorRef.detectChanges();
                }, 1000);
              });
            }
            else {
              this.messageService.add({
                key: 'warning', severity: 'error', summary: 'Error',
                detail: 'You have to be Logged in to One Drive for PDF Viewing', life: 10000
              });
            }
          });
        }
        else {
          this.pdfPanel.setVisible(false);
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Catalog & Plan NOT IMPLEMENTED', life: 10000 });
          // let injector = Injector.create([{
          //   provide: 'PDFInjection', useValue: { injection: true, ID: 234234 }//res.file.file.id }
          // }]);
          // let componentFactory = this.componentFactoryResolver.resolveComponentFactory(PdfComponent);
          // this.componentRef = componentFactory.create(injector, [], $('#pdfPanelInsert')[0]);
          // setTimeout(() => {
          //   this.componentRef.changeDetectorRef.detectChanges();
          // }, 500);
        }
        //////////////// TESTING ///////////////////////////
      }
    }
  }

  onsearchInput() {
    this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
    var filterItems = new Array();
    for (const key in this.searchInputObject) {
      if (this.searchInputObject.hasOwnProperty(key)) {
        const element = this.searchInputObject[key];
        if (element == null) { continue; }
        else {
          filterItems.push([key, element]);
        }
      }
    }
    var filteredInputs = this.filterItems(filterItems);
    // console.log(filteredInputs);

    filteredInputs.forEach(element => {
      var name = '';
      if (element.objectPath.indexOf('/')) {
        name = element.objectPath.split('/')[element.objectPath.split('/').length - 1];
      }
      else {
        name = element.objectPath;
      }
      // Rot
      var color = new THREE.Vector4(1, 0, 0, 1);
      let dbId = this.viewerComponent.viewer.search(name, (idArray) => {
        this.viewerComponent.viewer.setThemingColor(idArray[0], color);
        this.redSelectedDbIDs.push(idArray[0]);
      }, (err) => {
        this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something with COLORING went wrong: ' + err });
      }, ['name']);
    });
  }

  public onClickColor(event: Event) {
    console.log('onClickColor');
  }

  public setColor(parameter: string): Array<any> {
    var first = new Array();
    var second = new Array();
    switch (parameter) {
      case 'elevation':
        var a1 = 0;
        var a2 = 0;
        var a3 = 0;
        var a = 'rgb(' + a1 + ',' + a2 + ',' + a3 + ')';
        first.push(a);
        var aa = new THREE.Vector4(a1 / 256, a2 / 256, a3 / 256, 1);
        second.push(aa);

        var b1 = 0;
        var b2 = 6;
        var b3 = 56;
        var b = 'rgb(' + b1 + ',' + b2 + ',' + b3 + ')';
        first.push(b);
        var bb = new THREE.Vector4(b1 / 256, b2 / 256, b3 / 256, 1);
        second.push(bb);

        var c1 = 0;
        var c2 = 12;
        var c3 = 113;
        var c = 'rgb(' + c1 + ',' + c2 + ',' + c3 + ')';
        first.push(c);
        var cc = new THREE.Vector4(c1 / 256, c2 / 256, c3 / 256, 1);
        second.push(cc);

        var d1 = 0;
        var d2 = 18;
        var d3 = 170;
        var d = 'rgb(' + d1 + ',' + d2 + ',' + d3 + ')';
        first.push(d);
        var dd = new THREE.Vector4(d1 / 256, d2 / 256, d3 / 256, 1);
        second.push(dd);

        var e1 = 28;
        var e2 = 56;
        var e3 = 255;
        var e = 'rgb(' + e1 + ',' + e2 + ',' + e3 + ')';
        first.push(e);
        var ee = new THREE.Vector4(e1 / 256, e2 / 256, e3 / 256, 1);
        second.push(ee);

        var f1 = 85;
        var f2 = 103;
        var f3 = 254;
        var f = 'rgb(' + f1 + ',' + f2 + ',' + f3 + ')';
        first.push(f);
        var ff = new THREE.Vector4(f1 / 256, f2 / 256, f3 / 256, 1);
        second.push(ff);

        var g1 = 141;
        var g2 = 154;
        var g3 = 255;
        var g = 'rgb(' + g1 + ',' + g2 + ',' + g3 + ')';
        first.push(g);
        var gg = new THREE.Vector4(g1 / 256, g2 / 256, g3 / 256, 1);
        second.push(gg);

        var h1 = 141;
        var h2 = 154;
        var h3 = 255;
        var h = 'rgb(' + h1 + ',' + h2 + ',' + h3 + ')';
        first.push(h);
        var hh = new THREE.Vector4(h1 / 256, h2 / 256, h3 / 256, 1);
        second.push(hh);

        var i1 = 198;
        var i2 = 204;
        var i3 = 255;
        var i = 'rgb(' + i1 + ',' + i2 + ',' + i3 + ')';
        first.push(i);
        var ii = new THREE.Vector4(i1 / 256, i2 / 256, i3 / 256, 1);
        second.push(ii);

        var j1 = 255;
        var j2 = 255;
        var j3 = 255;
        var j = 'rgb(' + j1 + ',' + j2 + ',' + j3 + ')';
        first.push(j);
        var jj = new THREE.Vector4(j1 / 256, j2 / 256, j3 / 256, 1);
        second.push(jj);
        return [first, second];
      case 'opened':
        var true1 = 15;
        var true2 = 0;
        var true3 = 255;
        var true_1 = 'rgb(' + true1 + ',' + true2 + ',' + true3 + ')';
        first.push(true_1);
        var true_2 = new THREE.Vector4(true1 / 256, true2 / 256, true3 / 256, 1);
        second.push(true_2);

        var false1 = 240;
        var false2 = 255;
        var false3 = 0;
        var false_1 = 'rgb(' + false1 + ',' + false2 + ',' + false3 + ')';
        first.push(false_1);
        var false_2 = new THREE.Vector4(false1 / 256, false2 / 256, false3 / 256, 1);
        second.push(false_2);
        return [first, second];
      case 'lengthBC':
        //     *** Primary color:

        //     shade 0 = #AA5939 = rgb(170, 89, 57) = rgba(170, 89, 57,1) = rgb0(0.667,0.349,0.224)
        //     shade 1 = #FFC2AA = rgb(255,194,170) = rgba(255,194,170,1) = rgb0(1,0.761,0.667)
        //     shade 2 = #D4886A = rgb(212,136,106) = rgba(212,136,106,1) = rgb0(0.831,0.533,0.416)
        //     shade 3 = #803315 = rgb(128, 51, 21) = rgba(128, 51, 21,1) = rgb0(0.502,0.2,0.082)
        //     shade 4 = #551800 = rgb( 85, 24,  0) = rgba( 85, 24,  0,1) = rgb0(0.333,0.094,0)

        //  *** Secondary color (1):

        //     shade 0 = #AA7939 = rgb(170,121, 57) = rgba(170,121, 57,1) = rgb0(0.667,0.475,0.224)
        //     shade 1 = #FFDBAA = rgb(255,219,170) = rgba(255,219,170,1) = rgb0(1,0.859,0.667)
        //     shade 2 = #D4A76A = rgb(212,167,106) = rgba(212,167,106,1) = rgb0(0.831,0.655,0.416)
        //     shade 3 = #805215 = rgb(128, 82, 21) = rgba(128, 82, 21,1) = rgb0(0.502,0.322,0.082)
        //     shade 4 = #553100 = rgb( 85, 49,  0) = rgba( 85, 49,  0,1) = rgb0(0.333,0.192,0)

        //  *** Secondary color (2):

        //     shade 0 = #29506D = rgb( 41, 80,109) = rgba( 41, 80,109,1) = rgb0(0.161,0.314,0.427)
        //     shade 1 = #718EA4 = rgb(113,142,164) = rgba(113,142,164,1) = rgb0(0.443,0.557,0.643)
        //     shade 2 = #496D89 = rgb( 73,109,137) = rgba( 73,109,137,1) = rgb0(0.286,0.427,0.537)
        //     shade 3 = #123652 = rgb( 18, 54, 82) = rgba( 18, 54, 82,1) = rgb0(0.071,0.212,0.322)
        //     shade 4 = #042037 = rgb(  4, 32, 55) = rgba(  4, 32, 55,1) = rgb0(0.016,0.125,0.216)

        //  *** Complement color:

        //     shade 0 = #277553 = rgb( 39,117, 83) = rgba( 39,117, 83,1) = rgb0(0.153,0.459,0.325)
        //     shade 1 = #75AF96 = rgb(117,175,150) = rgba(117,175,150,1) = rgb0(0.459,0.686,0.588)
        //     shade 2 = #499272 = rgb( 73,146,114) = rgba( 73,146,114,1) = rgb0(0.286,0.573,0.447)
        //     shade 3 = #0F5738 = rgb( 15, 87, 56) = rgba( 15, 87, 56,1) = rgb0(0.059,0.341,0.22)
        //     shade 4 = #003A21 = rgb(  0, 58, 33) = rgba(  0, 58, 33,1) = rgb0(0,0.227,0.129)


        //  #####  Generated by Paletton.com (c) 2002-2014

        return [first, second];
      case 'lengthAB':
        // #999999
        var a1 = 153;
        var a2 = 153;
        var a3 = 153;
        var a = 'rgb(' + a1 + ',' + a2 + ',' + a3 + ')';
        first.push(a);
        var aa = new THREE.Vector4(a1 / 256, a2 / 256, a3 / 256, 1);
        second.push(aa);

        // #898991
        var b1 = 137;
        var b2 = 137;
        var b3 = 145;
        var b = 'rgb(' + b1 + ',' + b2 + ',' + b3 + ')';
        first.push(b);
        var bb = new THREE.Vector4(b1 / 256, b2 / 256, b3 / 256, 1);
        second.push(bb);

        // #7a7a89
        var c1 = 122;
        var c2 = 122;
        var c3 = 122;
        var c = 'rgb(' + c1 + ',' + c2 + ',' + c3 + ')';
        first.push(c);
        var cc = new THREE.Vector4(c1 / 256, c2 / 256, c3 / 256, 1);
        second.push(cc);

        // #6b6b81
        var d1 = 107;
        var d2 = 107;
        var d3 = 129;
        var d = 'rgb(' + d1 + ',' + d2 + ',' + d3 + ')';
        first.push(d);
        var dd = new THREE.Vector4(d1 / 256, d2 / 256, d3 / 256, 1);
        second.push(dd);

        // #5b5c79
        var e1 = 91;
        var e2 = 92;
        var e3 = 121;
        var e = 'rgb(' + e1 + ',' + e2 + ',' + e3 + ')';
        first.push(e);
        var ee = new THREE.Vector4(e1 / 256, e2 / 256, e3 / 256, 1);
        second.push(ee);

        // #4c4d71
        var f1 = 76;
        var f2 = 77;
        var f3 = 113;
        var f = 'rgb(' + f1 + ',' + f2 + ',' + f3 + ')';
        first.push(f);
        var ff = new THREE.Vector4(f1 / 256, f2 / 256, f3 / 256, 1);
        second.push(ff);

        // #3d3e69
        var g1 = 61;
        var g2 = 62;
        var g3 = 105;
        var g = 'rgb(' + g1 + ',' + g2 + ',' + g3 + ')';
        first.push(g);
        var gg = new THREE.Vector4(g1 / 256, g2 / 256, g3 / 256, 1);
        second.push(gg);

        // #2e2f61
        var h1 = 46;
        var h2 = 47;
        var h3 = 91;
        var h = 'rgb(' + h1 + ',' + h2 + ',' + h3 + ')';
        first.push(h);
        var hh = new THREE.Vector4(h1 / 256, h2 / 256, h3 / 256, 1);
        second.push(hh);

        // #1e2059
        var i1 = 30;
        var i2 = 32;
        var i3 = 89;
        var i = 'rgb(' + i1 + ',' + i2 + ',' + i3 + ')';
        first.push(i);
        var ii = new THREE.Vector4(i1 / 256, i2 / 256, i3 / 256, 1);
        second.push(ii);

        // #0f1151
        var j1 = 15;
        var j2 = 17;
        var j3 = 81;
        var j = 'rgb(' + j1 + ',' + j2 + ',' + j3 + ')';
        first.push(j);
        var jj = new THREE.Vector4(j1 / 256, j2 / 256, j3 / 256, 1);
        second.push(jj);

        // #260f62
        var k1 = 38;
        var k2 = 15;
        var k3 = 98;
        var k = 'rgb(' + k1 + ',' + k2 + ',' + k3 + ')';
        first.push(k);
        var kk = new THREE.Vector4(k1 / 256, k2 / 256, k3 / 256, 1);
        second.push(kk);

        // #3e0d73
        var l1 = 62;
        var l2 = 13;
        var l3 = 115;
        var l = 'rgb(' + l1 + ',' + l2 + ',' + l3 + ')';
        first.push(l);
        var ll = new THREE.Vector4(l1 / 256, l2 / 256, l3 / 256, 1);
        second.push(ll);

        // #560b85
        var m1 = 86;
        var m2 = 11;
        var m3 = 133;
        var m = 'rgb(' + m1 + ',' + m2 + ',' + m3 + ')';
        first.push(m);
        var mm = new THREE.Vector4(m1 / 256, m2 / 256, m3 / 256, 1);
        second.push(mm);

        // #6e0a96
        var n1 = 110;
        var n2 = 10;
        var n3 = 150;
        var n = 'rgb(' + n1 + ',' + n2 + ',' + n3 + ')';
        first.push(n);
        var nn = new THREE.Vector4(n1 / 256, n2 / 256, n3 / 256, 1);
        second.push(nn);

        // #8608a8
        var o1 = 134;
        var o2 = 8;
        var o3 = 168;
        var o = 'rgb(' + o1 + ',' + o2 + ',' + o3 + ')';
        first.push(o);
        var oo = new THREE.Vector4(o1 / 256, o2 / 256, o3 / 256, 1);
        second.push(oo);

        // #9d06b9
        var p1 = 157;
        var p2 = 6;
        var p3 = 185;
        var p = 'rgb(' + p1 + ',' + p2 + ',' + p3 + ')';
        first.push(p);
        var pp = new THREE.Vector4(p1 / 256, p2 / 256, p3 / 256, 1);
        second.push(pp);

        // #b505ca
        var q1 = 181;
        var q2 = 5;
        var q3 = 202;
        var q = 'rgb(' + q1 + ',' + q2 + ',' + q3 + ')';
        first.push(q);
        var qq = new THREE.Vector4(q1 / 256, q2 / 256, q3 / 256, 1);
        second.push(qq);

        // #cd03dc
        var r1 = 205;
        var r2 = 3;
        var r3 = 220;
        var r = 'rgb(' + r1 + ',' + r2 + ',' + r3 + ')';
        first.push(r);
        var rr = new THREE.Vector4(r1 / 256, r2 / 256, r3 / 256, 1);
        second.push(rr);

        // #e501ed
        var s1 = 229;
        var s2 = 1;
        var s3 = 237;
        var s = 'rgb(' + s1 + ',' + s2 + ',' + s3 + ')';
        first.push(s);
        var ss = new THREE.Vector4(s1 / 256, s2 / 256, s3 / 256, 1);
        second.push(ss);

        // #fd00ff
        var t1 = 253;
        var t2 = 0;
        var t3 = 255;
        var t = 'rgb(' + t1 + ',' + t2 + ',' + t3 + ')';
        first.push(t);
        var tt = new THREE.Vector4(t1 / 256, t2 / 256, t3 / 256, 1);
        second.push(tt);

        // #fb19e5 ab hier
        var u1 = 251;
        var u2 = 25;
        var u3 = 229;
        var u = 'rgb(' + u1 + ',' + u2 + ',' + u3 + ')';
        first.push(u);
        var uu = new THREE.Vector4(u1 / 256, u2 / 256, u3 / 256, 1);
        second.push(uu);

        // #fa33cc
        var v1 = 250;
        var v2 = 51;
        var v3 = 204;
        var v = 'rgb(' + v1 + ',' + v2 + ',' + v3 + ')';
        first.push(v);
        var vv = new THREE.Vector4(v1 / 256, v2 / 256, v3 / 256, 1);
        second.push(vv);

        // #f84cb2
        var w1 = 248;
        var w2 = 76;
        var w3 = 178;
        var w = 'rgb(' + w1 + ',' + w2 + ',' + w3 + ')';
        first.push(w);
        var ww = new THREE.Vector4(w1 / 256, w2 / 256, w3 / 256, 1);
        second.push(ww);

        // #f76699
        var x1 = 247;
        var x2 = 102;
        var x3 = 153;
        var x = 'rgb(' + x1 + ',' + x2 + ',' + x3 + ')';
        first.push(x);
        var xx = new THREE.Vector4(x1 / 256, x2 / 256, x3 / 256, 1);
        second.push(xx);

        // #f57f7f
        var y1 = 245;
        var y2 = 127;
        var y3 = 127;
        var y = 'rgb(' + y1 + ',' + y2 + ',' + y3 + ')';
        first.push(y);
        var yy = new THREE.Vector4(y1 / 256, y2 / 256, y3 / 256, 1);
        second.push(yy);

        // #f49965
        var z1 = 244;
        var z2 = 153;
        var z3 = 101;
        var z = 'rgb(' + z1 + ',' + z2 + ',' + z3 + ')';
        first.push(z);
        var zz = new THREE.Vector4(z1 / 256, z2 / 256, z3 / 256, 1);
        second.push(zz);

        // #f2b24c
        var ab1 = 242;
        var ab2 = 178;
        var ab3 = 76;
        var ab = 'rgb(' + ab1 + ',' + ab2 + ',' + ab3 + ')';
        first.push(ab);
        var abab = new THREE.Vector4(ab1 / 256, ab2 / 256, ab3 / 256, 1);
        second.push(abab);

        // #f1cc32
        var ac1 = 241;
        var ac2 = 204;
        var ac3 = 50;
        var ac = 'rgb(' + ac1 + ',' + ac2 + ',' + ac3 + ')';
        first.push(ac);
        var acac = new THREE.Vector4(ac1 / 256, ac2 / 256, ac3 / 256, 1);
        second.push(acac);

        // #efe519
        var ad1 = 239;
        var ad2 = 229;
        var ad3 = 25;
        var ad = 'rgb(' + ad1 + ',' + ad2 + ',' + ad3 + ')';
        first.push(ad);
        var adad = new THREE.Vector4(ad1 / 256, ad2 / 256, ad3 / 256, 1);
        second.push(adad);

        // #eeff00
        var ae1 = 238;
        var ae2 = 255;
        var ae3 = 0;
        var ae = 'rgb(' + ae1 + ',' + ae2 + ',' + ae3 + ')';
        first.push(ae);
        var aeae = new THREE.Vector4(ae1 / 256, ae2 / 256, ae3 / 256, 1);
        second.push(aeae);
        console.log(first.length);
        console.log(second.length);
        return [first, second];
      case 'lengthCD':

        return [first, second];
      case 'lengthDA':

    }
  }

  public filterItems(filters) {
    return this.inputs.filter(val => {
      let result = true;
      // tslint:disable-next-line: prefer-for-of
      for (var i = 0; i < filters.length; i++) {
        // console.log(val[filters[i][0]]);
        // console.log(filters[i][1]);
        if (val[filters[i][0]] !== filters[i][1]) { result = false; }
      }
      return result;
    });
  }

  onChange(event) {
    console.log(event);
    console.log(this.input);
    if (event.target) {
      $(event.target).parent().parent().addClass('unsavedChanged');
      this.unsavedChanged = true;
    }
    else if (event.originalEvent) {
      if (typeof event.value === 'boolean') {
        // Das Else muss die Checkbox für TRUE/FALSE abgreifen
        $(event.originalEvent.target).parent().parent().parent().parent().parent().addClass('unsavedChanged');
        this.unsavedChanged = true;
      }
      else {
        $(event.originalEvent.target).parent().parent().parent().parent().parent().parent().parent().parent().parent().addClass('unsavedChanged');
      }
    }
  }

  onCancelInput() {
    this.searchInputObject = new SearchInput('generic');
    this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
  }

  onEdit(input: InputObject) {
    if (input.inputId === null) {
      this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'There is NO PANEL selected' });
    }
    else {
      this.editTable = true;
    }
  }

  // Alte Version mit Weiterleitung
  //   public showPDF(fromWhere: string, input: InputObject) {
  //   if (input.inputId === null) {
  //     this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'There is NO PANEL selected' });
  //   }
  //   else {
  //     if (fromWhere === 'plan') {
  //       this.api.getInfobyName(this.input.project + '_' + this.input.type + this.pdfNaming[1] + '.pdf').then(res => {
  //         if (res === null) {
  //           this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Not available', detail: 'No Plan PDF existing' });
  //         }
  //         else {
  //           this.showingPdf = true;
  //           this.router.navigate(['platform/editing/pdf'], { queryParams: { id: input.inputId, whichButton: fromWhere } });
  //         }
  //       });
  //     }
  //     if (fromWhere === 'catalog') {
  //       this.api.getInfobyName(this.input.project + '_' + this.pdfNaming[0] + this.input.type + this.pdfNaming[1] + '.pdf').then(res => {
  //         if (res === null) {
  //           this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Not available', detail: 'No Catalog PDF existing' });
  //         }
  //         else {
  //           this.showingPdf = true;
  //           this.router.navigate(['platform/editing/pdf'], { queryParams: { id: input.inputId, whichButton: fromWhere } });
  //         }
  //       });
  //     }
  //     if (fromWhere === 'quality') {
  //       this.api.getInfobyName(this.input.project + '_' + this.input.type + this.pdfNaming[1] + '.pdf').then(res => {
  //         if (res === null) {
  //           this.messageService.add({ key: 'warning', severity: 'warn', summary: 'Not available', detail: 'No Quality PDF existing' });
  //         }
  //         else {
  //           this.showingPdf = true;
  //           this.router.navigate(['platform/editing/pdf'], { queryParams: { id: input.inputId, whichButton: fromWhere } });
  //         }
  //       });
  //     }
  //     if (fromWhere === 'generic') {
  //       this.showingPdf = true;
  //       this.router.navigate(['platform/editing/pdf'], { queryParams: { id: null, whichButton: fromWhere } });
  //     }
  //   }
  // }

  public async onSave(input: InputObject) {
    this.platform.app.openSpinner();
    setTimeout(() => {
      if (this.multiSelectDbIds.length === 0) {
        if (typeof input.zone !== 'number' && input.zone !== null) {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Zone has to be a NUMBER' });
          return null;
        }
        if (typeof input.elevation !== 'number' && input.elevation !== null) {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Elevation has to be a NUMBER' });
          return null;
        }
        if (typeof input.opened !== 'boolean' && input.opened !== null) {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Opened has to be a BOOLEAN' });
          return null;
        }
        if (typeof input.lengthAB !== 'number' && input.lengthAB !== null) {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Length AB has to be a NUMBER' });
          return null;
        }
        if (typeof input.lengthBC !== 'number' && input.lengthBC !== null) {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Length BC has to be a NUMBER' });
          return null;
        }
        if (typeof input.lengthCD !== 'number' && input.lengthCD !== null) {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Length CD has to be a NUMBER' });
          return null;
        }
        if (typeof input.lengthDA !== 'number' && input.lengthDA !== null) {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Length DA has to be a NUMBER' });
          return null;
        }
        this.api.saveSpecificInput(input).then(
          res => {
            if (res === null) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with SAVING' });
              this.platform.app.closeSpinner();
            }
            else {
              this.api.getAllInputs(this.platform.currentProject._id).then(
                inputs => {
                  this.inputs = inputs;
                  this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: res + ' INPUT was UPDATED' });
                  this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
                  this.editTable = false;
                  this.unsavedChanged = false;
                  this.platform.app.closeSpinner();
                }
              );
            }
          }
        );
      }
      // Bei Multiselect
      else {
        var result = Object.entries(input).filter(([key, value]) => value !== null ? { [key]: value } : null);
        // Die ersten zwei sind ID und InputId
        result = result.slice(2);
        var savingInputs: InputObject[] = new Array();
        var promise = new Promise((resolve, reject) => {
          this.multiSelectDbIds.forEach((dbId, index) => {
            this.viewerComponent.viewer.model.getProperties(dbId, (r) => {
              savingInputs.push(this.inputs.find(element => {
                if (element.objectPath.indexOf('/')) {
                  if (element.objectPath.split('/')[element.objectPath.split('/').length - 1] === r.name) {
                    result.forEach(keyValuePair => {
                      // console.log(keyValuePair);
                      // console.log(element);
                      if (keyValuePair[0] === 'additionalParameter') {
                        keyValuePair[1].forEach((additionalParam, indexParam) => {
                          if (additionalParam.value !== null) {
                            element.additionalParameter[indexParam].value = additionalParam.value;
                          }
                        });
                      }
                      else {
                        element[keyValuePair[0]] = keyValuePair[1];
                      }
                    });
                    return true;
                  }
                  else {
                    return false;
                  }
                }
                else {
                  if (element.objectPath === r.name) {
                    result.forEach(keyValuePair => {
                      if (keyValuePair[0] === 'additionalParameter') {
                        keyValuePair[1].forEach((additionalParam, indexParam) => {
                          if (additionalParam.value !== null) {
                            element.additionalParameter[indexParam].value = additionalParam.value;
                          }
                        });
                      }
                      else {
                        element[keyValuePair[0]] = keyValuePair[1];
                      }
                    });

                    return true;
                  }
                  else {
                    return false;
                  }
                }
              }));
              if (index === this.multiSelectDbIds.length - 1) {
                resolve();
                this.multiSelectDbIds = [];
              }
            }, (err) => {
              this.platform.app.closeSpinner();
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong: ' + err });
            });
          });
        });

        // Wenn das obere ausgeführt ist
        promise.then(() => {
          console.log('All done!');
          console.log(savingInputs);
          this.api.saveMultipleInput(savingInputs).then(
            res => {
              if (res === null) {
                this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong with SAVING' });
              }
              else {
                this.api.getAllInputs(this.platform.currentProject._id).then(
                  inputs => {
                    this.inputs = inputs;
                    // @ts-ignore
                    this.messageService.add({ key: 'warning', severity: 'success', summary: 'Success', detail: res.modified + ' INPUT was UPDATED', life: 5000 });
                    this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
                    this.editTable = false;
                    this.unsavedChanged = false;
                    this.platform.app.closeSpinner();
                  }
                );
              }
            }
          );
        });
      }
    }, 1500);
  }


  onCancel(input: InputObject) {
    this.api.getSpecificInput(input._id.toString()).then(
      res => {
        this.input = res;
        // Das Array inputs muss auch noch angepasst werden, da dieses durch die Verknüpfungen auch schon geändert wurde
        var foundIndex = this.inputs.findIndex(x => x.inputId === this.input.inputId);
        this.inputs[foundIndex] = this.input;
        this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
        this.editTable = false;
        this.unsavedChanged = false;
      }
    );
  }

  // * Funktionen für den Toast kein Modell vorhanden *//

  onConfirm_Toast_noModel() {
    this.platform.app.closeOverlay();
    this.messageService.clear('noModel');
    // Hier weiterleiten dass beim Projekt ein Model hochgeladen werden kann
    /* Nur für Development */
    this.router.navigate(['/platform/' + this.platform.returnComponent]);
    this.platform.onNavigationChanged(this.platform.returnComponent);
  }

  onRejectnoModel() {
    this.platform.app.closeOverlay();
    this.messageService.clear('noModel');
    this.router.navigate(['/platform/' + this.platform.returnComponent]);
    this.platform.onNavigationChanged(this.platform.returnComponent);
  }

  onConfirmsectionExtension() {
    this.viewerComponent.viewer.getExtension('SectionExtension', (res) => {
      // @ts-ignore
      res.onConfirmsectionExtension();
    });
  }

  onRejectsectionExtension() {
    this.viewerComponent.viewer.getExtension('SectionExtension', (res) => {
      // @ts-ignore
      res.onRejectsectionExtension();
    });
  }

  // ERP Funktionen

  public computingStatusERP() {
    this.erpObjects.forEach(object => {
      if (object.qtyProduced === 0 && object.qtyShipped === 0 && object.qtyToBeProduced !== 0 && object.qtyToBeShipped !== 0) {
        object.status = 'none';
        // console.log(object.qtyProduced + ' ' + object.qtyShipped + ' ' + object.qtyToBeProduced + ' ' + object.qtyToBeShipped + ' ' + object.status);
      }
      else if (object.qtyProduced !== 0 && object.qtyShipped === 0 && object.qtyToBeProduced !== 0 && object.qtyToBeShipped !== 0) {
        object.status = 'Production started';
        // console.log(object.qtyProduced + ' ' + object.qtyShipped + ' ' + object.qtyToBeProduced + ' ' + object.qtyToBeShipped + ' ' + object.status);
      }
      else if (object.qtyProduced !== 0 && object.qtyShipped !== 0 && object.qtyToBeProduced !== 0 && object.qtyToBeShipped !== 0) {
        object.status = 'Delivery started - Production ongoing';
        // console.log(object.qtyProduced + ' ' + object.qtyShipped + ' ' + object.qtyToBeProduced + ' ' + object.qtyToBeShipped + ' ' + object.status);
      }
      else if (object.qtyProduced !== 0 && object.qtyShipped !== 0 && object.qtyToBeProduced === 0 && object.qtyToBeShipped !== 0) {
        object.status = 'Delivery started - Production finished';
        // console.log(object.qtyProduced + ' ' + object.qtyShipped + ' ' + object.qtyToBeProduced + ' ' + object.qtyToBeShipped + ' ' + object.status);
      }
      else if (object.qtyProduced !== 0 && object.qtyShipped !== 0 && object.qtyToBeProduced === 0 && object.qtyToBeShipped === 0) {
        object.status = 'Delivery finished';
        // console.log(object.qtyProduced + ' ' + object.qtyShipped + ' ' + object.qtyToBeProduced + ' ' + object.qtyToBeShipped + ' ' + object.status);
      }
      else {
        object.status = 'Installed';
        // console.log(object.qtyProduced + ' ' + object.qtyShipped + ' ' + object.qtyToBeProduced + ' ' + object.qtyToBeShipped + ' ' + object.status);
      }
    });
  }

  async showValuesOfParameterERP(parameter: string) {
    // Hilfsarray löschen
    this.colorMap = null;
    this.colorMapBoolean = false;
    this.keepColorArray = null;
    // löschen des Panels
    if (this.panel) {
      this.panel.container.remove();
    }
    if (parameter === 'status') {
      var valuesOfParameter;
      // Alle Objekte hidden und dann Farbe ändern
      $('.spinner').show();
      this.viewerComponent.viewer.setGhosting(false);
      this.viewerComponent.viewer.hide(this.viewerComponent.viewer.model.getRootId());

      var container = this.viewerComponent.viewer.container as HTMLElement;
      this.panel = new Autodesk.Viewing.UI.DockingPanel(container, 'parameterLegend', 'Parameter Legend: ' + parameter, { localizeTitle: true, addFooter: true });
      this.panel.setVisible(true);
      this.panel.content = document.createElement('div');
      const contentDiv = this.panel.content as HTMLElement;
      contentDiv.classList.add('container', 'border-box');
      contentDiv.style.boxSizing = 'border-box';
      $(this.panel.content).append(html);
      contentDiv.style.overflowY = 'scroll';
      contentDiv.style.height = 'calc(100% - 90px)';
      contentDiv.style.color = 'black';
      this.panel.container.classList.add('docking-panel-container-solid-color-a');
      this.panel.container.style.height = '350px';
      this.panel.container.style.width = '600px';
      this.panel.container.style.minWidth = '600px';
      this.panel.container.style.resize = 'none';

      // FOOTER ==> Orginal Grösse 20 px
      this.panel.footer.style.height = '40px';
      this.panel.footer.style.paddingLeft = '14px';
      this.panel.footer.style.paddingTop = '10px';
      this.panel.footer.append('Number of Values: ' + 'TO BE SET');

      this.panel.container.appendChild(this.panel.content as HTMLElement);

      var colorDivHeader = document.createElement('div');
      colorDivHeader.setAttribute('class', 'p-col-2');
      colorDivHeader.setAttribute('style', 'margin-right: 10px');
      colorDivHeader.innerHTML = '<div class="box">' + 'Color' + '</div>';
      $(this.panel.container).find('#legend')[0].appendChild(colorDivHeader as HTMLElement);

      // var textDivHeader = document.createElement('div');
      // textDivHeader.setAttribute('class', 'p-col-1');
      // textDivHeader.innerHTML = '<div class="box"></div>';
      // $(this.panel.container).find('#legend')[0].appendChild(textDivHeader as HTMLElement);

      var textDivHeader2 = document.createElement('div');
      textDivHeader2.setAttribute('class', 'p-col-2');
      textDivHeader2.innerHTML = '<div class="box">' + 'Value' + '</div>';
      // set style
      textDivHeader2.style.color = 'red';
      $(this.panel.container).find('#legend')[0].appendChild(textDivHeader2 as HTMLElement);

      // var textDivHeader3 = document.createElement('div');
      // textDivHeader3.setAttribute('class', 'p-col-1');
      // textDivHeader3.innerHTML = '<div class="box"></div>';
      // $(this.panel.container).find('#legend')[0].appendChild(textDivHeader3 as HTMLElement);

      var textDivHeader4 = document.createElement('div');
      textDivHeader4.setAttribute('class', 'p-col-2');
      textDivHeader4.innerHTML = '<div class="box">' + 'Quantity' + '</div>';
      // set style
      textDivHeader4.style.color = 'brown';
      $(this.panel.container).find('#legend')[0].appendChild(textDivHeader4 as HTMLElement);

      var textDivHeader4 = document.createElement('div');
      textDivHeader4.setAttribute('class', 'p-col-2');
      textDivHeader4.innerHTML = '<div class="box">' + 'Percentage' + '</div>';
      textDivHeader4.style.color = 'violet';
      $(this.panel.container).find('#legend')[0].appendChild(textDivHeader4 as HTMLElement);

      var textDivHeader5 = document.createElement('div');
      textDivHeader5.setAttribute('class', 'p-col-2');
      textDivHeader5.innerHTML = '<div class="box">' + 'Area m&sup2' + '</div>';
      textDivHeader5.style.color = 'green';
      $(this.panel.container).find('#legend')[0].appendChild(textDivHeader5 as HTMLElement);

      // Event Listener bei Schliessen des Panels -> alle Farben ausgeblendet
      let tempViewerComponent = this.viewerComponent;
      $(this.panel.container).find('.docking-panel-close').click((e) => {
        tempViewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
        return false;
      });

      // Dies ist die Sortierung für den Parameter Status
      if (parameter === 'status') {
        valuesOfParameter = ['none', 'Production started', 'Delivery started - Production ongoing'
          , 'Delivery started - Production finished', 'Delivery finished', 'Installed'];
      }

      await asyncForEach(valuesOfParameter, async (value, index) => {
        var erpObjectsPerStatus: ERPObject[] = this.erpObjects.filter(erpobject => {
          return erpobject[parameter] === value;
        });

        // if (value === 'Production started') {
        //   console.log(erpObjectsPerStatus);
        //   erpObjectsPerStatus.forEach(element => {
        //     console.log(element.itemNr.slice(1, 5));
        //   });
        // }

        // Farbe definieren
        let random1 = (Math.floor(Math.random() * 256));
        let random2 = (Math.floor(Math.random() * 256));
        let random3 = (Math.floor(Math.random() * 256));
        var hue = 'rgb(' + random1 + ',' + random2 + ',' + random3 + ')';
        var color = new THREE.Vector4(random1 / 256, random2 / 256, random3 / 256, 1);

        if (value === 'none') {
          hue = 'rgb(0, 0, 0)';
          color = new THREE.Vector4(0, 0, 0, 1);
        }

        var colorDiv = document.createElement('div');
        colorDiv.setAttribute('class', 'p-col-2');
        colorDiv.setAttribute('style', 'margin-right: 10px');
        colorDiv.innerHTML = '<div class="box" style="background-color: ' + hue + ' ; height: 20px"></div>';
        var box = colorDiv.children[0];
        box.setAttribute('value', value);

        // Event Listeners
        box.addEventListener('mouseover', (event) => {
          var targetElement = event.target as HTMLElement;
          targetElement.style.backgroundColor = 'rgb(255, 0, 0)';
        }, false);
        box.addEventListener('mouseout', (event) => {
          var targetElement = event.target as HTMLElement;
          targetElement.style.backgroundColor = hue;
        }, false);

        // Event Listener für Click auf Farb Box ERP
        box.addEventListener('click', async (event) => {
          var targetElement = event.target as HTMLElement;
          var valueOfClicked = targetElement.getAttribute('value');
          // @ts-ignore
          this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.getHiddenModels()[0]);

          var erbObjectPerStatus = this.erpObjects.filter(erpObject => {
            return erpObject.status === valueOfClicked;
          });
          // Alle ERP Objects mit z.B Status ==='none' => erpObjectPerStatus
          await asyncForEach(erpObjectsPerStatus, async (erpObject, idx) => {
            // Sucht alle Inputs heraus welche input.lot === erpObject.lot && erpObject.itemNr.slice(1, 5)) === input.type
            var inputsSameLot = this.inputs.filter(input => {
              return input.lot === Number(erpObject.lot.split('-')[erpObject.lot.split('-').length - 1])
                && Number(erpObject.itemNr.slice(1, 5)) === Number(input.type);
            });

            // tslint:disable-next-line: no-shadowed-variable
            await asyncForEach(inputsSameLot, async (input) => {
              // console.log(input);
              var name = '';
              if (input.objectPath.indexOf('/')) {
                name = input.objectPath.split('/')[input.objectPath.split('/').length - 1];
              }
              else {
                name = input.objectPath;
              }
              // // Rot
              var redColor = new THREE.Vector4(1, 0, 0, 1);
              let dbId = this.viewerComponent.viewer.search(name, (idArray) => {
                this.viewerComponent.viewer.setThemingColor(idArray[0], redColor);
              }, (err) => {
                this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something with COLORING went wrong: ' + err });
              }, ['name']);
            });
          });
        }, false);
        $(this.panel.container).find('#legend')[0].appendChild(colorDiv as HTMLElement);

        // // Abstandbox
        // var textDiv = document.createElement('div');
        // textDiv.setAttribute('class', 'p-col-1');
        // textDiv.innerHTML = '<div class="box"></div>';
        // $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

        var textDiv = document.createElement('div');
        textDiv.setAttribute('class', 'p-col-2');
        textDiv.innerHTML = '<div class="box">' + value + '</div>';
        // set style
        textDiv.style.color = 'red';
        $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

        // // Abstandbox
        // var textDiv = document.createElement('div');
        // textDiv.setAttribute('class', 'p-col-1');
        // textDiv.innerHTML = '<div class="box"></div>';
        // $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

        var textDiv = document.createElement('div');
        textDiv.setAttribute('class', 'p-col-2');
        textDiv.innerHTML = '<div class="box">' + erpObjectsPerStatus.length + '</div>';
        // set style
        textDiv.style.color = 'brown';
        $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

        // // Abstandbox
        // var textDiv = document.createElement('div');
        // textDiv.setAttribute('class', 'p-col-1');
        // textDiv.innerHTML = '<div class="box"></div>';
        // $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

        var textDiv = document.createElement('div');
        textDiv.setAttribute('class', 'p-col-2');

        textDiv.innerHTML = '<div class="box">' + ((erpObjectsPerStatus.length / this.erpObjects.length) * 100).toFixed(3) + ' %' + '</div>';
        textDiv.style.color = 'violet';
        $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

        // Der auskommentierte Teil der folgt ist nach .then() verschoben
        // var textDiv = document.createElement('div');
        // textDiv.setAttribute('class', 'p-col-2');
        var sumArea = 0;
        // textDiv.innerHTML = '<div class="box">' + sumArea / 1000000 + '</div>';
        // textDiv.style.color = 'green';
        // $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);

        // Alle ERP Objects mit z.B Status ==='none' => erpObjectPerStatus
        await asyncForEach(erpObjectsPerStatus, async (erpObject, idx) => {
          // Sucht alle Inputs heraus welche input.lot === erpObject.lot && erpObject.itemNr.slice(1, 5)) === input.type
          var inputsSameLot = this.inputs.filter(input => {
            return input.lot === Number(erpObject.lot.split('-')[erpObject.lot.split('-').length - 1])
              && Number(erpObject.itemNr.slice(1, 5)) === Number(input.type);
          });

          // tslint:disable-next-line: no-shadowed-variable
          await asyncForEach(inputsSameLot, async (input) => {
            // console.log(input);
            sumArea += input.area;
            var name = '';
            if (input.objectPath.indexOf('/')) {
              name = input.objectPath.split('/')[input.objectPath.split('/').length - 1];
            }
            else {
              name = input.objectPath;
            }
            // // Rot
            // var redColor = new THREE.Vector4(1, 0, 0, 1);
            let dbId = this.viewerComponent.viewer.search(name, (idArray) => {
              this.viewerComponent.viewer.setThemingColor(idArray[0], color);
            }, (err) => {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something with COLORING went wrong: ' + err });
            }, ['name']);
          });
        }).then(() => {
          var textDiv = document.createElement('div');
          textDiv.setAttribute('class', 'p-col-2');
          textDiv.innerHTML = '<div class="box">' + sumArea / 1000000 + '</div>';
          textDiv.style.color = 'green';
          $(this.panel.container).find('#legend')[0].appendChild(textDiv as HTMLElement);
        });
      }).then(() => {
        setTimeout(() => {
          $('.spinner').hide();
          this.viewerComponent.viewer.showAll();
        }, 3000);

      });
    }
    else {
      return null;
    }
  }

  // War am Anfang auch im HTML
  public async selectionChanged(event: SelectionChangedEventArgs) {
    this.additionalParameterBoolean = false;
    // console.log(this.multiSelectDbIds.length);
    // console.log('this.multiSelectDbIds');
    // console.log(this.colorMap);
    // console.log(event);

    // Wenn Section Mode aktiviert -> Keine Selection möglich
    if (this.sectionMode) {
      // Dass Double Clicking möglich ist
      setTimeout(() => {
        this.viewerComponent.viewer.clearSelection();
        return null;
      }, 100);
    }
    if (!this.colorMapBoolean) {
      const fragList = this.viewerComponent.viewer.model.getFragmentList();
      this.colorMap = fragList.db2ThemingColor;
      this.colorMapBoolean = true;
      this.keepColorArray = new Array();
    }
    else {
      this.keepColorArray.forEach((storedOldValue, index) => {
        this.colorMap[index] = storedOldValue;
      });
    }

    const dbIdArray = (event as any).dbIdArray;
    this.editTable = false;
    //////////////////// ERP Mode //////////////////////////////
    if (this.erpMode) {
      if (dbIdArray.length) {
        // Multiselect
        if (dbIdArray.length >= 2) {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Multi-Select is NOT allowed in ERP Mode' });
          this.viewerComponent.viewer.clearSelection();
          this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
          this.input = new InputObject('generic');
          this.selectedERPObject = new ERPObject('generic');
          return null;
        }
        else {
          this.dbId = dbIdArray[0];
          this.viewerComponent.viewer.model.getProperties(this.dbId, (r) => {
            try {
              // const fragList = this.viewerComponent.viewer.model.getFragmentList().db2ThemingColor;

              // const colorMap = fragList.db2ThemingColor;
              this.input = this.inputs.find(input => {
                if (input.objectPath.indexOf('/')) {
                  return input.objectPath.split('/')[input.objectPath.split('/').length - 1] === r.name;
                }
                else {
                  return input.objectPath === r.name;
                }
              });
              this.selectedERPObject = this.erpObjects.find(erpobject => {
                return Number(erpobject.lot.split('-')[erpobject.lot.split('-').length - 1]) === this.input.lot
                  && Number(erpobject.itemNr.slice(1, 5)) === Number(this.input.type.toString())
                  && erpobject.statFam0 === 'ELE';
              });

              if (this.selectedERPObject === undefined) {
                this.messageService.add({
                  key: 'warning', severity: 'error', summary: 'Error', detail: 'Cannot find a corresponding ERP Data -> Please check ERP Data Set'
                });
                this.selectedERPObject = new ERPObject('generic');
                return null;
              }

              if (this.coloringClearing) {
                this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
              }

              // Sucht alle Inputs heraus welche input.lot === element.lot
              var inputsSameLot = new Array<InputObject>();
              if (this.differentiateTypesMode) {
                var inputsSameLot = this.inputs.filter(input => {
                  return input.lot === Number(this.selectedERPObject.lot.split('-')[this.selectedERPObject.lot.split('-').length - 1]);
                });
              }
              else {
                var inputsSameLot = this.inputs.filter(input => {
                  return input.lot === Number(this.selectedERPObject.lot.split('-')[this.selectedERPObject.lot.split('-').length - 1])
                    && Number(this.selectedERPObject.itemNr.slice(1, 5)) === Number(input.type.toString());
                });
              }

              var allValuesOfType = [...new Set(inputsSameLot.map(input => input.type))];

              asyncForEach(allValuesOfType, async (type, index) => {
                // Farbe definieren für jeden Type
                // Wenn mehr als 5 verschiedene Typen => Random Color
                let colorERP;
                if (index > 4) {
                  let random1 = (Math.floor(Math.random() * 256));
                  let random2 = (Math.floor(Math.random() * 256));
                  let random3 = (Math.floor(Math.random() * 256));
                  colorERP = new THREE.Vector4(random1 / 256, random2 / 256, random3 / 256, 1);
                }
                else {
                  let colorDigit = 255 - (59 * (index + 1));
                  colorERP = new THREE.Vector4(colorDigit / 256, 0, 0, 1);
                }
                // tslint:disable-next-line: no-shadowed-variable
                inputsSameLot.forEach(input => {
                  var name = '';
                  if (input.objectPath.indexOf('/')) {
                    name = input.objectPath.split('/')[input.objectPath.split('/').length - 1];
                  }
                  else {
                    name = input.objectPath;
                  }
                  if (input.type === type) {
                    // // Rot
                    // var redColor = new THREE.Vector4(1, 0, 0, 1);
                    let dbId = this.viewerComponent.viewer.search(name, (idArray) => {
                      this.keepColorArray[idArray[0]] = this.colorMap[idArray[0]];
                      this.viewerComponent.viewer.setThemingColor(idArray[0], colorERP);
                      this.redSelectedDbIDs.push(idArray[0]);
                    }, (err) => {
                      this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something with COLORING went wrong: ' + err });
                    }, ['name']);
                  }
                });
              }).then(() => {
                asyncForEach(this.colorMap, (colorObject, index) => {
                  this.viewerComponent.viewer.setThemingColor(index, colorObject);
                }).then(() => {
                  this.input = new InputObject('generic');
                  this.viewerComponent.viewer.clearSelection();
                });
              });
            } catch (error) {
              this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something with COLORING went wrong: ' + error });
            }
          });
        }
      }
      // Auf kein Panel geklickt
      else {
        if (this.colorMap) {
          return null;
        }
        else {
          this.input = new InputObject('generic');
          this.selectedERPObject = new ERPObject('generic');
          this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
          // Mobile
        }
      }
    }

    // Normaler Modus
    else {
      if (this.unsavedChanged) {
        // this.viewerComponent.viewer.clearSelection();
        this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'There are unsaved Changes' });
        var color = new THREE.Vector4(1, 0, 0, 1);
        this.viewerComponent.viewer.setThemingColor(this.dbId, color);
        return null;
      }
      const dbIdArray = (event as any).dbIdArray;
      this.editTable = false;
      if (dbIdArray.length) {
        // Auf das gleiche Panel geklickt
        if (this.dbId === dbIdArray[0] && dbIdArray.length === 1) {
          this.multiSelectDbIds = [];
          $('#mobile-text-button-facade').attr('data-before', 'Facade');
          return null;
        }
        // Multiselect
        else if (dbIdArray.length >= 2) {
          this.multiSelectDbIds = [];
          this.summedArea = 0;
          this.summedlengthAB = 0;
          this.summedlengthBC = 0;
          this.summedlengthCD = 0;
          this.summedlengthDA = 0;

          // Additional Parameter
          var inputTemp = this.input;
          this.input = new InputObject('multiselect');
          if (this.input.additionalParameter.length === 0) {
            // Gleich viel AdditionalParameter erstellen wie vorhanden
            this.inputs[0].additionalParameter.forEach(addParameter => {
              this.input.additionalParameter.push(
                {
                  internID: addParameter.internID,
                  field: addParameter.field,
                  dataType: addParameter.dataType,
                  value: null,
                }
              );
            });
          }
          else {
            // Gleich viel AdditionalParameter erstellen wie vorhanden
            inputTemp.additionalParameter.forEach(addParameter => {
              this.input.additionalParameter.push(
                {
                  internID: addParameter.internID,
                  field: addParameter.field,
                  dataType: addParameter.dataType,
                  value: null,
                }
              );
            });
          }
          this.input.additionalParameter.forEach(param => {
            param.value = null;
          });

          dbIdArray.forEach(element => {
            this.multiSelectDbIds.push(element);
            this.viewerComponent.viewer.model.getProperties(element, (r) => {
              var tempInput = this.inputs.find(input => {
                if (input.objectPath.indexOf('/')) {
                  return input.objectPath.split('/')[input.objectPath.split('/').length - 1] === r.name;
                }
                else {
                  return element.objectPath === r.name;
                }
              });
              this.summedArea += tempInput.area;
              this.summedlengthAB += tempInput.lengthAB;
              this.summedlengthBC += tempInput.lengthBC;
              this.summedlengthCD += tempInput.lengthCD;
              this.summedlengthDA += tempInput.lengthDA;

            });
          });
          this.additionalParameterBoolean = true;
          // data-before im CSS vom Viewer definiert
          $('#multiselect-button-list-length').attr('data-before', dbIdArray.length);
        }
        // Nur ein Panel geklickt
        else {
          this.multiSelectDbIds = []; // Nicht sicher ob das korrekt ist
          this.dbId = dbIdArray[0];
          // console.log(this.dbId);

          // data-before im CSS vom Viewer definiert
          $('#multiselect-button-list-length').attr('data-before', 1);
          // console.log(this.viewerComponent.viewer.model.getData());
          this.viewerComponent.viewer.model.getProperties(this.dbId, (r) => {
            this.input = this.inputs.find(element => {
              if (element.objectPath.indexOf('/')) {
                return element.objectPath.split('/')[element.objectPath.split('/').length - 1] === r.name;
              }
              else {
                return element.objectPath === r.name;
              }
            });
            // console.log(this.input);
            this.additionalParameterBoolean = true;

            if (this.isMobile) {
              // Mobile
              $('#mobile-text-button-facade').attr('data-before', this.input.facade);
              $('#mobile-text-button-type').attr('data-before', this.input.type);
              $('#mobile-text-button-u').attr('data-before', this.input.u);
              $('#mobile-text-button-v').attr('data-before', this.input.v);
              $('#mobile-text-button-instance').attr('data-before', this.input.instance);
              $('#mobile-text-button-status').attr('data-before', this.input.status);
              $('#mobile-button-counter').attr('data-before', '1');
              if (this.input.additionalParameter.length > 0) {
                $('#mobile-text-button-additionalParameter').attr('data-before', this.input.additionalParameter[0].value);
              }
              else {
                $('#mobile-text-button-additionalParameter').attr('data-before', 'X');
              }
            }

            // console.log(this.dbId);
            // console.log(this.inputs.find(element => {
            //   if (element.objectPath.indexOf('/')) {
            //     return element.objectPath.split('/')[element.objectPath.split('/').length - 1] === r.name;
            //   }
            //   else {
            //     return element.objectPath === r.name;
            //   }
            // }
            // ));
          }, (err) => {
            this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong: ' + err });
          });
        }
      }
      // Auf kein Element geklickt
      else {
        this.redSelectedDbIDs = [];
        // data-before im CSS vom Viewer definiert
        $('#multiselect-button-list-length').attr('data-before', 0);
        this.multiSelectDbIds = [];
        this.input = new InputObject('generic');
        this.viewerComponent.viewer.clearThemingColors(this.viewerComponent.viewer.model);
        // Mobile
        if (this.isMobile) {
          $('#mobile-text-button-facade').attr('data-before', 'Facade');
          $('#mobile-text-button-type').attr('data-before', 'Type');
          $('#mobile-text-button-additionalParameter').attr('data-before', this.firstAdditionalparameter.field);
          $('#mobile-text-button-u').attr('data-before', 'U');
          $('#mobile-text-button-v').attr('data-before', 'V');
          $('#mobile-text-button-instance').attr('data-before', 'Instance');
          $('#mobile-text-button-status').attr('data-before', 'Status');
          $('#mobile-button-counter').attr('data-before', '0');
        }
      }
    }
  }

  public async showCustomView(event) {
    this.hitTest = null;
    this.normal = null;
    this.sameFacadedbIds = null;
    // @ts-ignore
    var screenPoint = {
      x: event.layerX,
      y: event.layerY
    };
    this.hitTest = this.viewerComponent.viewer.impl.hitTest(screenPoint.x, screenPoint.y, false);
    // console.log(hitTest);
    if (!this.hitTest) {
      return null;
    }

    var sameFacade: Array<InputObject> = new Array();
    this.sameFacadedbIds = new Array();

    this.viewerComponent.viewer.model.getProperties(this.hitTest.dbId, (r) => {
      this.inputs.find(element => {
        if (element.objectPath.indexOf('/')) {
          if (element.objectPath.split('/')[element.objectPath.split('/').length - 1] === r.name) {
            this.inputs.find(ele => {
              if (ele.facade === element.facade) {
                sameFacade.push(ele);
              }
            }
            );
          }
        }
        else {
          if (element.objectPath === r.name) {
            this.inputs.find(ele => {
              if (ele.facade === element.facade) {
                sameFacade.push(ele);
              }
            });
          }
        }
      });
    }, (err) => {
      this.messageService.add({ key: 'warning', severity: 'error', summary: 'Error', detail: 'Something went wrong: ' + err });
    });

    $('.spinner').show();
    // Rechtklick
    $('.menu.docking-panel.docking-panel-container-solid-color-a').hide();

    this.viewerComponent.viewer.hide(this.viewerComponent.viewer.model.getRootId());
    this.viewerComponent.viewer.setGhosting(false);
    // this.viewerComponent.viewer.loadExtension('CoordinatesAxesExtension', {});

    setTimeout(() => {
      asyncForEach(sameFacade, input => {
        this.viewerComponent.viewer.search(input.objectPath, (dbId) => {
          this.sameFacadedbIds.push(dbId[0]);
        }, (error) => {
          this.messageService.add({ key: 'warning', severity: 'error', summary: 'Section Mode', detail: ' ERROR ' + error });
        }, ['name'] /* this array indicates the filter: search only on 'Name'*/
        );
      });

      setTimeout(() => {
        this.normal = { mode: 'original', value: this.hitTest.face.normal.clone() };
        // this.normal.mode = ;
        // this.normal.value = 
        this.normal.value.x = this.normal.value.x * 100000;
        this.normal.value.y = this.normal.value.y * 100000;
        this.normal.value.z = this.normal.value.z * 100000;

        ////////////// Testing ///////////////

        // var linesMaterial = new THREE.LineBasicMaterial({
        //   color: new THREE.Color(0xFF0000),
        //   transparent: true,
        //   depthWrite: false,
        //   depthTest: true,
        //   linewidth: 10,
        //   opacity: 1.0
        // });

        // var geometry = new THREE.Geometry();
        // geometry.vertices.push(new THREE.Vector3(start.x, start.y, start.z));
        // geometry.vertices.push(new THREE.Vector3(end.x, end.y, end.z));
        // geometry.computeLineDistances();
        // var lines = new THREE.Line(geometry,
        //   linesMaterial,
        //   THREE.LinePieces);
        // // @ts-ignore
        // if (!this.viewer.overlays.hasScene('bounding-box')) {
        //   // @ts-ignore
        //   this.viewer.overlays.addScene('bounding-box');
        // }
        // // @ts-ignore
        // this.viewer.overlays.addMesh(lines, 'bounding-box');

        ////////////// Testing ///////////////


        // @ts-ignore
        var cameraPosition = new THREE.Vector3(this.hitTest.point.x + this.normal.value.x, this.hitTest.point.y + this.normal.value.y,
          this.hitTest.point.z + this.normal.value.z);
        // @ts-ignore
        var target = this.hitTest.point;
        // console.log(cameraPosition);
        this.viewerComponent.viewer.navigation.setView(cameraPosition, target);
        // @ts-ignore
        this.viewerComponent.viewer.navigation.orientCameraUp();
        // @ts-ignore
        this.viewerComponent.viewer.navigation.toOrthographic();
        this.viewerComponent.viewer.fitToView(this.sameFacadedbIds, this.viewerComponent.viewer.model, false);

        // Show Elements
        // @ts-ignore
        this.viewerComponent.viewer.show(this.sameFacadedbIds, this.viewerComponent.viewer.model);

        var boundingBox = this.getModifiedWorldBoundingBoxMultiple(this.sameFacadedbIds);
        // @ts-ignore
        // this.viewerComponent.viewer.getExtension('SectionExtension').drawBox(boundingBox.min, boundingBox.max);

        // @ts-ignore
        this.viewerComponent.viewer.getExtension('SectionExtension').allSections.forEach(section => {
          if (section.positionTop && section.positionBottom) {
            if (!this.controlIfMeshWithinBoundingBox(section, boundingBox)) {
              // @ts-ignore
              if (this.viewerComponent.viewer.overlays.hasScene(section.internID)) {
                // @ts-ignore
                this.viewerComponent.viewer.overlays.removeScene(section.internID);
              }
            }
          }
        });

        $('.spinner').hide();
        // Rechtklick
        $('.menu.docking-panel.docking-panel-container-solid-color-a').show();

      }, 500);
    }, 1000);
  }

  controlIfMeshWithinBoundingBox(section: SectionObject, box: THREE.Box3) {
    if (section.positionTop[0] > box.max.x || section.positionBottom[0] < box.min.x) {
      return false;
    }
    else if (section.positionTop[1] > box.max.y || section.positionBottom[1] < box.min.y) {
      return false;
    }
    else if (section.positionTop[2] > box.max.z || section.positionBottom[2] < box.min.z) {
      return false;
    }
    else {
      return true;
    }
  }

  getModifiedWorldBoundingBoxMultiple(dbId: Array<number>) {
    var instanceTree = this.viewerComponent.viewer.model.getData().instanceTree;
    var fragIds = [];
    dbId.forEach(dbid => {
      instanceTree.enumNodeFragments(dbid, (fragId) => {
        fragIds.push(fragId);
      });
    });

    // fragments list array
    var fragList = this.viewerComponent.viewer.model.getFragmentList();
    const fragbBox = new THREE.Box3();
    const nodebBox = new THREE.Box3();

    fragIds.forEach((fragId) => {
      fragList.getWorldBounds(fragId, fragbBox);
      nodebBox.union(fragbBox);
    });
    return nodebBox;
  }

  onResize() {
    this.viewerComponent.viewer.resize();
  }
}
