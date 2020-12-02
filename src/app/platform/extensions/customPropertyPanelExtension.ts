///////////////////////////////////////////////////////////////////////////////

/// <reference types="forge-viewer" />

import { Extension } from '../../viewer/extensions/extension';

declare const THREE: any;

export class CustomPropertyPanelExtension extends Extension {
  // Extension must have a name
  public static extensionName: string = 'CustomPropertyPanelExtension';
  public _self = this;
  public _axisLines = [];
  public _panel= null;

  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this._panel = null;
  }

CustomPropertyPanel.prototype.setNodeProperties = function (nodeId) {
    Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype.setNodeProperties.call(this, nodeId);
    this.nodeId = nodeId; // store the dbId for later use
};

CustomPropertyPanelExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
CustomPropertyPanelExtension.prototype.constructor = CustomPropertyPanelExtension;

load() {
    return true;
};

onToolbarCreated() {
    this._panel = new CustomPropertyPanel(this.viewer, this.options);
    var _this = this;
    this.viewer.addEventListener(Autodesk.Viewing.EXTENSION_LOADED_EVENT, function (e) {
        if (e.extensionId !== 'Autodesk.PropertiesManager') return;
        var ext = _this.viewer.getExtension('Autodesk.PropertiesManager');
        ext.setPanel(_this._panel);
    })
};

unload(){
    if (this._panel == null) return;
    var ext = this.viewer.getExtension('Autodesk.PropertiesManager');
    this._panel = null;
    ext.setDefaultPanel();
    return true;
}

function CustomPropertyPanel(viewer, options) {
  this.viewer = viewer;
  this.options = options;
  this.nodeId = -1; // dbId of the current element showing properties
  Autodesk.Viewing.Extensions.ViewerPropertyPanel.call(this, this.viewer);
}

CustomPropertyPanel.prototype = Object.create(Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype);
CustomPropertyPanel.prototype.constructor = CustomPropertyPanel;

CustomPropertyPanel.prototype.setProperties = function (properties, options) {
  Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype.setProperties.call(this, properties, options);

  // add your custom properties here
  // for example, let's show the dbId and externalId
  var _this = this;
  // dbId is right here as nodeId
  this.addProperty('dbId', this.propertyNodeId, 'Custom Properties');
  // externalId is under all properties, let's get it!
  this.viewer.getProperties(this.propertyNodeId, function (props) {
      _this.addProperty('externalId', props.externalId, 'Custom Properties');
  })
}

