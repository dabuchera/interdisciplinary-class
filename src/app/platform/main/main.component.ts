import { Component, OnInit, Input } from '@angular/core';
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
} from '../../viewer/extensions/extension';

import { AuthToken } from 'forge-apis';
import { ApiService } from 'src/app/_services/api.service';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  @Input() app: AppComponent;

  public viewerOptions3d: ViewerOptions;
  public encodedmodelurn: string;

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
        extensions: ['Autodesk.Snapping'], //, 'GetPositionExtension'], //[IconMarkupExtension.extensionName], // [GetParameterExtension.extensionName], 
        theme: 'dark-theme',
      },
      onViewerScriptsLoaded: this.scriptsLoaded,
      onViewerInitialized: (async (args: ViewerInitializedEvent) => {
        console.log(this.encodedmodelurn);
        if (this.encodedmodelurn) {
          args.viewerComponent.DocumentId = this.encodedmodelurn;
        }

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
    this.app.openSpinner();
    setTimeout(() => {
      this.app.closeSpinner();
    }, 3000);
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

  public async selectionChanged(event: SelectionChangedEventArgs) {
    console.log('selectionChanged');
    const dbIdArray = (event as any).dbIdArray;
    console.log(dbIdArray);
  }
}
