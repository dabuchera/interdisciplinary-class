/// <reference types="forge-viewer" />
import { takeUntil } from 'rxjs/operators';

declare const Autodesk: any;

import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy,
  Output
} from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { ScriptService } from '../service/script.service';
import {
  FitToViewEventArgs,
  FullscreenEventArgs,
  GeometryLoadedEventArgs,
  HideEventArgs,
  IsolateEventArgs,
  ObjectTreeCreatedEventArgs,
  ObjectTreeUnavailableEventArgs, ResetEventArgs,
  SelectionChangedEventArgs,
  /* Für Development/Neu gebraucht */
  ExtensionLoadedEventArgs,
  ViewerStateRestoredEventArgs,
  ShowEventArgs,
  ViewerEventArgs,
  LayerVisibilityEventArgs,
  ViewerToolbarCreatedEventArgs,
} from '../extensions/extension';
import { BasicExtension } from '../extensions/basic-extension';
import { AuthToken } from 'forge-apis';

export interface DocumentChangedEvent {
  document: Autodesk.Viewing.Document;
  viewerComponent: ViewerComponent;
  viewer: Autodesk.Viewing.Viewer3D;
}

export interface ItemLoadedEvent {
  item: Autodesk.Viewing.ViewerItem;
  viewer: Autodesk.Viewing.Viewer3D;
  viewerComponent: ViewerComponent;
}

export interface ViewerInitializedEvent {
  viewerComponent: ViewerComponent;
  viewer: Autodesk.Viewing.Viewer3D;
}

export interface ViewerOptions {
  initializerOptions: Autodesk.Viewing.InitializerOptions;
  viewerConfig?: Autodesk.Viewing.ViewerConfig;
  headlessViewer?: boolean;
  showFirstViewable?: boolean;
  enableMemoryManagement?: boolean;
  onViewerScriptsLoaded?: () => void;
  onViewerInitialized: (args: ViewerInitializedEvent) => void;
}


@Component({
  selector: 'app-forge-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerComponent implements OnDestroy {
  readonly containerId = 'forge-viewer';

  // tslint:disable-next-line: no-output-on-prefix
  @Output() public onDocumentChanged = new EventEmitter<DocumentChangedEvent>();
  @Output() public onItemLoaded = new EventEmitter<ItemLoadedEvent>();
  @Output() public onError = new EventEmitter<Autodesk.Viewing.ErrorCodes>();

  // Viewer events
  @Output() public onFitToView = new EventEmitter<FitToViewEventArgs>();
  @Output() public onFullscreen = new EventEmitter<FullscreenEventArgs>();
  @Output() public onGeometryLoaded = new EventEmitter<GeometryLoadedEventArgs>();
  @Output() public onHide = new EventEmitter<HideEventArgs>();
  @Output() public onIsolate = new EventEmitter<IsolateEventArgs>();
  @Output() public onObjectTreeCreated = new EventEmitter<ObjectTreeCreatedEventArgs>();
  @Output() public onObjectTreeUnavailable = new EventEmitter<ObjectTreeUnavailableEventArgs>();
  @Output() public onReset = new EventEmitter<ResetEventArgs>();
  @Output() public onSelectionChanged = new EventEmitter<SelectionChangedEventArgs>();
  @Output() public onShow = new EventEmitter<ShowEventArgs>();

  /* Für Development/Neu gebraucht */
  @Output() public onExtensionLoaded = new EventEmitter<ExtensionLoadedEventArgs>();
  @Output() public onViewerRestored = new EventEmitter<ViewerStateRestoredEventArgs>();
  @Output() public layerVisibilityChanged = new EventEmitter<LayerVisibilityEventArgs>();
  @Output() public toolbarCreated = new EventEmitter<ViewerToolbarCreatedEventArgs>();


  // Debugging
  @Input() public showDebugMessages = false;

  private _viewerOptions: ViewerOptions = null;
  private viewerInitialized = false;
  // Muss angepasst werden ob headless oder nicht
  public viewer: Autodesk.Viewing.GuiViewer3D;
  private documentId: string;
  private unsubscribe: Subject<boolean> = new Subject();
  private basicExt: BasicExtension;

  public number = '1';

  public get Container(): HTMLElement {
    return document.getElementById(this.containerId);
  }

  /**
   * Helper to allow callers to specify documentId with or without the required urn: prefix
   */
  private static verifyUrn(documentId: string): string {
    return (documentId.startsWith('urn:')) ? documentId : `urn:${documentId}`;
  }

  constructor(private script: ScriptService) { }

  @Input() public set viewerOptions(options: ViewerOptions) {
    if (!this.viewerInitialized && options) {
      this._viewerOptions = options;
      void this.initialiseViewer();
    }
  }

  public get viewerOptions() {
    return this._viewerOptions;
  }

  ngOnDestroy() {
    this.unregisterBasicExtension();

    if (this.viewer) {
      this.viewer.tearDown();
      this.viewer.uninitialize();
    }

    this.viewer = null;
    this.viewerInitialized = false;

    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  /**
   * Helper method to get some default viewer options
   */
  public getDefaultViewerOptions(
    onViewerInitialized: (args: ViewerInitializedEvent) => void,
    getAccessToken: (onGetAccessToken: (token: string, expire: number) => void) => void,
  ): ViewerOptions {
    return {
      initializerOptions: {
        env: 'AutodeskProduction',
        getAccessToken,
        api: 'derivativeV2',
      },
      onViewerInitialized,
    };
  }

  /**
   * Get a reference to the current 3D viewer
   */
  public get Viewer3D(): Autodesk.Viewing.Viewer3D {
    return this.viewer;
  }

  /**
   * Get the document urn that has been loaded
   */
  public get DocumentId() {
    return this.documentId;
  }

  /**
   * Set the document urn, which triggers the viewer to load the document
   */
  public set DocumentId(value: string) {
    this.documentId = value;
    this.loadModel(this.documentId);
  }

  public get basicExtension() {
    return this.basicExt;
  }

  public get extensionEvents(): Observable<ViewerEventArgs> | null {
    if (this.basicExt) {
      return this.basicExt.viewerEvents;
    }
  }

  public loadDocumentNode(document: Autodesk.Viewing.Document,
    bubbleNode: Autodesk.Viewing.BubbleNode,
    options?: object): Promise<Autodesk.Viewing.Model> {
    return this.viewer.loadDocumentNode(document, bubbleNode, options);
  }

  /**
   * We don't bundle Autodesk's scripts with the component, and we don't really want users to have
   * to add the scripts to their index.html pages. So we'll load them when required.
   */
  private loadScripts(): Promise<void> {
    return this.script.load(
      'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js',
    ).then((data) => {
      console.log('script loaded');
      console.log(data[0]);
    })
      .catch(error => this.error(error));
  }

  /**
   * Initialises the viewer
   */
  private async initialiseViewer() {
    // Load scripts first
    await this.loadScripts();
    if (this.viewerOptions.onViewerScriptsLoaded) this.viewerOptions.onViewerScriptsLoaded();

    // Check if the viewer has already been initialised - this isn't the nicest, but we've set the env in our
    // options above so we at least know that it was us who did this!
    if (!Autodesk.Viewing.Private.env) {
      Autodesk.Viewing.Initializer(this.viewerOptions.initializerOptions, () => {
        this.initialized();
      });
    } else {
      // We need to give an initialised viewing application a tick to allow the DOM element
      // to be established before we re-draw
      setTimeout(() => {
        this.initialized();
      });
    }
  }

  private initialized() {
    // Register an extension to help us raise events
    const extName = this.registerBasicExtension();
    const config = this.addBasicExtensionConfig(extName);

    // Support large models
    if (this.viewerOptions.enableMemoryManagement) {
      config.loaderExtensions = { svf: 'Autodesk.MemoryLimited' };
    }

    // Create a new viewer
    // Changed that for adding Toolbar in Headless Viewer
    if (this.viewerOptions.headlessViewer) {
      // @ts-ignore
      this.viewer = new Autodesk.Viewing.Viewer3D(this.Container, config);
    } else {
      this.viewer = new Autodesk.Viewing.GuiViewer3D(this.Container, config);
    }

    // Start the viewer
    this.viewer.start(undefined);

    // Viewer is ready - scripts are loaded and we've create a new viewing application
    this.viewerInitialized = true;
    this.viewerOptions.onViewerInitialized({ viewerComponent: this, viewer: this.viewer });
  }

  /**
   * Loads a model in to the viewer via it's urn
   */
  public loadModel(documentId: string) {
    if (!documentId) {
      return;
    }

    // Add urn: to the beginning of document id if needed
    Autodesk.Viewing.Document.load(ViewerComponent.verifyUrn(documentId),
      this.onDocumentLoadSuccess.bind(this),
      this.onDocumentLoadFailure.bind(this));
  }

  /**
   * Document successfully loaded
   */
  private onDocumentLoadSuccess(document: Autodesk.Viewing.Document) {
    if (!document.getRoot()) return;

    // Emit an event so the caller can do something
    // TODO: config option to specify which viewable to display (how?)
    this.onDocumentChanged.emit({ document, viewerComponent: this, viewer: this.viewer });

    if (this.viewerOptions.showFirstViewable === undefined || this.viewerOptions.showFirstViewable) {
      let model: Autodesk.Viewing.BubbleNode = (document.getRoot() as any).getDefaultGeometry();
      if (!model) {
        const allModels = document.getRoot().search({ type: 'geometry' });
        model = allModels[0];
      }

      void this.viewer.loadDocumentNode(document, model, undefined);
    }
  }

  /**
   * Failed to load document
   */
  private onDocumentLoadFailure(errorCode: Autodesk.Viewing.ErrorCodes) {
    this.error('onDocumentLoadFailure() - errorCode:' + errorCode);
    this.onError.emit(errorCode);
  }

  /**
   * Register our BasicExtension with the Forge Viewer
   */
  private registerBasicExtension(): string {
    BasicExtension.registerExtension(BasicExtension.extensionName, this.extensionLoaded.bind(this));
    return BasicExtension.extensionName;
  }

  /**
   * Subscript to BasicExtension events when the extension has been
   * succesfully loaded by the viewer.
   */
  private extensionLoaded(ext: BasicExtension) {
    this.basicExt = ext;
    ext.viewerEvents
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((item: ViewerEventArgs) => {
        this.log(item);

        if (item instanceof FitToViewEventArgs) {
          this.onFitToView.emit(item);
          // console.log('FitToViewEventArgs');
        } else if (item instanceof FullscreenEventArgs) {
          this.onFullscreen.emit(item);
          // console.log('FullscreenEventArgs');
        } else if (item instanceof GeometryLoadedEventArgs) {
          this.onGeometryLoaded.emit(item);
          // console.log('GeometryLoadedEventArgs');
        } else if (item instanceof HideEventArgs) {
          this.onHide.emit(item);
          // console.log('HideEventArgs');
        } else if (item instanceof IsolateEventArgs) {
          this.onIsolate.emit(item);
          // console.log('IsolateEventArgs');
        } else if (item instanceof ObjectTreeCreatedEventArgs) {
          this.onObjectTreeCreated.emit(item);
          // console.log('ObjectTreeCreatedEventArgs');
        } else if (item instanceof ObjectTreeUnavailableEventArgs) {
          this.onObjectTreeUnavailable.emit(item);
          // console.log('ObjectTreeUnavailableEventArgs');
        } else if (item instanceof ResetEventArgs) {
          this.onReset.emit(item);
          // console.log('ResetEventArgs');
        } else if (item instanceof SelectionChangedEventArgs) {
          this.onSelectionChanged.emit(item);
          // console.log('SelectionChangedEventArgs');
        } else if (item instanceof ShowEventArgs) {
          this.onShow.emit(item);
          // console.log('ShowEventArgs');
        }

        /* Für Development/Neu gebraucht */
        else if (item instanceof ExtensionLoadedEventArgs) {
          this.onExtensionLoaded.emit(item);
        }
        else if (item instanceof ViewerStateRestoredEventArgs) {
          this.onViewerRestored.emit(item);
          console.log('onViewerRestored');
        }
        else if (item instanceof LayerVisibilityEventArgs) {
          this.layerVisibilityChanged.emit(item);
          console.log('layerVisibilityChanged');
        }
        else if (item instanceof ViewerToolbarCreatedEventArgs) {
          this.toolbarCreated.emit(item);
          console.log('toolbarCreated');
        }
      }
      );
  }

  private unregisterBasicExtension() {
    BasicExtension.unregisterExtension(BasicExtension.extensionName);
    this.basicExt = null;
  }

  /**
   * Add list of extensions to the viewer config that has been provided
   * The allows the user to register their own extensions.
   */
  private addBasicExtensionConfig(extName: string): Autodesk.Viewing.ViewerConfig {
    const config: Autodesk.Viewing.ViewerConfig = Object.assign(
      {},
      this.viewerOptions.viewerConfig,
      { extensions: [] },
    );

    // We will always load our basic extension with any others specified by the caller
    if (this.viewerOptions.viewerConfig && this.viewerOptions.viewerConfig.extensions) {
      config.extensions = [...this.viewerOptions.viewerConfig.extensions, extName];
    } else {
      config.extensions = [extName];
    }

    return config;
  }

  private log(message?: any, ...optionalParams: any[]) {
    if (!this.showDebugMessages) return;
    console.log(message, optionalParams);
  }

  private error(message?: any, ...optionalParams: any[]) {
    if (!this.showDebugMessages) return;
    console.error(message, optionalParams);
  }
}
