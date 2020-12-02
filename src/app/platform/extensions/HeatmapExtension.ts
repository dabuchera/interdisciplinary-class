///////////////////////////////////////////////////////////////////////////////

/// <reference types="forge-viewer" />

import { Extension } from '../../viewer/extensions/extension';

declare const THREE: any;

export class HeatmapExtension extends Extension {
  // Extension must have a name
  public static extensionName: string = 'HeatmapExtension';
  public _self = this;
  // public _axisLines = [];

  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
  }

  load() {
    console.log('Autodesk.ADN.Viewing.Extension.AxisHelper loaded');
    setTimeout(() => {
      // this.addAxisHelper();
      //workaround
      //have to call this to show up the axis
      this.viewer.restoreState(this.viewer.getState());
    }, 4000);
    return true;
  }

  unload() {
    // this.removeAxisHelper();
    // console.log('Autodesk.ADN.Viewing.Extension.AxisHelper unloaded');
    return true;
  }

  onToolbarCreated() {
    let _group = this.viewer.toolbar.getControl('myToolbarGroup');
    if (!_group) {
      _group = new Autodesk.Viewing.UI.ControlGroup('myToolbarGroup');
      this.viewer.toolbar.addControl(_group);
    }

    let _enabled = false;
    const _button = new Autodesk.Viewing.UI.Button('heatmapButton');
    _button.onClick = async (ev) => {
      _enabled = !_enabled;
      if (_enabled) {
        const ids = await this.getLeafNodes();
        this.colorNodes(ids);
      } else {
        this.viewer.clearThemingColors(this.viewer.model);
      }
    };
    _button.setToolTip('Heatmap');
    _button.addClass('heatmapButtonIcon');
    _group.addControl(_button);
  }

  getLeafNodes() {
    return new Promise((resolve, reject) => {
      this.viewer.getObjectTree((tree) => {
        let dbids = [];
        tree.enumNodeChildren(
          tree.getRootId(),
          (dbid) => {
            if (tree.getChildCount(dbid) === 0) {
              dbids.push(dbid);
            }
          },
          true
        );
        resolve(dbids);
      });
    });
  }
  colorNodes(ids) {
    const filterProps = ['Area'];
    const MaxArea = 100.0;
    this.viewer.model.getBulkProperties(ids, filterProps, (items) => {
      for (const item of items) {
        const areaProp = item.properties[0];
        const normalizedArea = Math.min(
          1.0,
          parseFloat(areaProp.displayValue) / MaxArea
        );
        const color = new THREE.Color();
        color.setHSL(normalizedArea * 0.33, 1.0, 0.5);
        this.viewer.setThemingColor(
          item.dbId,
          new THREE.Vector4(color.r, color.g, color.b, 0.5)
        );
      }
    });
  }
}
