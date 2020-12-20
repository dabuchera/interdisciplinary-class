// import { Zone } from '../zones/zone';
// import { zones } from '../main/main.component';

// Dashboard panel base
export class DashboardPanel {
  public divId: any;
  public viewer: Autodesk.Viewing.Viewer3D;
  load(parentDivId, divId, viewer) {
    this.divId = divId;
    this.viewer = viewer;
    $('#' + parentDivId).append(
      '<div id="' + divId + '" class="dashboardPanel"></div>'
    );
  }
}

// Dashboard panels for charts
export class DashboardPanelChart extends DashboardPanel {
  public propertyToUse: any;
  // public wdToUse: any;
  public canvasId: any;
  public modelData: any;

  // public zonesData: any;
  //modeData is not needed, maybe use Work Density Data of all zones or per floor

  // loadwithData(parentDivId, divId, viewer, zonesData) {
  //   if (!zonesData.hasProperty(this.propertyToUse)) {
  //     alert(
  //       'This zones does not contain a ' +
  //         this.propertyToUse +
  //         ' property for the ' +
  //         this.constructor.name
  //     );
  //     console.log('These are the properties available on this zones: ');
  //     console.log(Object.keys(zonesData._zonesData));
  //     return false;
  //   }
  //   console.log(divId);
  //   divId = this.wdToUse.replace(/[^A-Za-z0-9]/gi, '') + divId; // div name = property + chart type
  //   // console.log(divId);
  //   super.load(parentDivId, divId, viewer);
  //   this.canvasId = divId + 'Canvas';
  //   $('#' + divId).append(
  //     '<canvas id="' +
  //       this.canvasId +
  //       '" width="400px" height="400px"></canvas>'
  //   );
  //   this.zonesData = zonesData;
  //   console.log(zonesData);
  //   return true;
  // }

  loadwithData(parentDivId, divId, viewer, modelData) {
    if (!modelData.hasProperty(this.propertyToUse)) {
      alert(
        'This model does not contain a ' +
          this.propertyToUse +
          ' property for the ' +
          this.constructor.name
      );
      console.log('These are the properties available on this model: ');
      console.log(Object.keys(modelData._modelData));
      return false;
    }
    console.log(divId);
    divId = this.propertyToUse.replace(/[^A-Za-z0-9]/gi, '') + divId; // div name = property + chart type
    console.log(divId);
    super.load(parentDivId, divId, viewer);
    this.canvasId = divId + 'Canvas';
    $('#' + divId).append(
      '<canvas id="' +
        this.canvasId +
        '" width="400px" height="400px"></canvas>'
    );
    this.modelData = modelData;
    console.log(modelData);
    return true;
  }

  generateColors(count) {
    var background = [];
    var borders = [];
    for (var i = 0; i < count; i++) {
      var r = Math.round(Math.random() * 255);
      var g = Math.round(Math.random() * 255);
      var b = Math.round(Math.random() * 255);
      background.push('rgba(' + r + ', ' + g + ', ' + b + ', 0.2)');
      borders.push('rgba(' + r + ', ' + g + ', ' + b + ', 0.2)');
    }
    return { background: background, borders: borders };
  }
}

// export class ZonesData {
//   public _viewer: Autodesk.Viewing.Viewer3D;
//   public zonesData: any;
//   public zones: any;

//   constructor(viewer) {
//     this.zonesData = {
//       label: String,
//       wdData: Number,
//     };
//     this._viewer = viewer;
//   }

//   init(callback) {
//     var _this = this;
//     // this._zonesData.labels = zone1.trade;

//     this.zones.forEach((element) => {
//       _this.zonesData.label = element.id;
//       _this.zonesData.wdData = element.wd;
//     });
//     console.log(_this.zonesData);
//   }

// Model data in format for charts
export class ModelData {
  public _viewer: Autodesk.Viewing.Viewer3D;
  public _modelData: any;

  constructor(viewer) {
    this._modelData = {};
    this._viewer = viewer;
  }

  init(callback) {
    var _this = this;

    // for every zone and per floor show Work Density

    _this.getAllLeafComponents((dbIds) => {
      let count = dbIds.length;
      dbIds.forEach((dbId) => {
        this._viewer.getProperties(dbId, (props) => {
          // console.log(_this._modelData.props);//undefined
          props.properties.forEach((prop) => {
            // console.log(_this._modelData);

            if (!isNaN(Number(prop.displayValue))) {
              return; // let's not categorize properties that store numbers
            }

            // some adjustments for revit:
            prop.displayValue = prop.displayValue.replace('Revit ', ''); // remove this Revit prefix
            if (prop.displayValue.indexOf('<') === 0) {
              return;
            } // skip categories that start with <

            // ok, now let's organize the data into this hash table
            if (_this._modelData[prop.displayName] == null) {
              _this._modelData[prop.displayName] = {};
            }
            if (_this._modelData[prop.displayName][prop.displayValue] == null) {
              _this._modelData[prop.displayName][prop.displayValue] = [];
            }
            _this._modelData[prop.displayName][prop.displayValue].push(dbId);
            // console.log(_this._modelData[prop.displayName][prop.displayValue]);
          });
          if (--count == 0) {
            callback();
          }
        });
      });

      // console.log(_this._modelData);
    });
  }

  //////////////not needed/////////////////////
  getAllLeafComponents(callback) {
    // from https://learnforge.autodesk.io/#/viewer/extensions/panel?id=enumerate-leaf-nodes
    console.log(this._viewer);
    this._viewer.getObjectTree(function (tree) {
      var leaves = [];
      tree.enumNodeChildren(
        tree.getRootId(),
        function (dbId) {
          if (tree.getChildCount(dbId) === 0) {
            leaves.push(dbId);
          }
        },
        true
      );
      callback(leaves);
    });
  }

  hasProperty(propertyName) {
    return this._modelData[propertyName] !== undefined;
  }

  getLabels(propertyName) {
    return Object.keys(this._modelData[propertyName]);
  }
  // getLabels() {
  //   return Object.keys(this.zonesData.label);
  // }

  getCountInstances(propertyName) {
    return Object.keys(this._modelData[propertyName]).map(
      (key) => this._modelData[propertyName][key].length
    );
  }
  // getCountInstances(dbids) {
  //   return Object.keys(zones[dbids]).map(
  //     (key) => zones[dbids][key].length
  //   );
  // }

  getIds(propertyName, propertyValue) {
    return this._modelData[propertyName][propertyValue];
  }
}
