import { ViewerComponent } from 'src/app/viewer/component/viewer.component';
import { ModelData } from './DashboardPanel';
// import { Zone } from '../zones/zone';
// import { ZonesData } from './DashboardPanel';
import { OnInit } from '@angular/core';

// Handles the Dashboard panels
export class Dashboard {
  public _viewer: Autodesk.Viewing.Viewer3D;
  public _panels: any[];

  constructor(viewer, panels) {
    this._viewer = viewer;
    this._panels = panels;
    this.adjustLayout();
    this._viewer.addEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      (viewer) => {
        this.loadPanels();
      }
    );
    // this.loadPanels = this.loadPanels.bind(this);
  }

  adjustLayout() {
    // this function may vary for layout to layout...
    // for learn forge tutorials, let's get the ROW and adjust the size of the
    // columns so it can fit the new dashboard column, also we added a smooth transition css class for a better user experience

    /////////////////////////// Commented that out ///////////////////////

    // // // // // const row = $('.row').children();
    // // // // // $(row[0]).removeClass('col-sm-12').addClass('col-sm-8 transition-width');
    // // // // // $(row[1])
    // // // // //   .removeClass('col-sm-12')
    // // // // //   .addClass('col-sm-4 transition-width')
    // // // // //   .after('<div class="col-sm-4 transition-width" id="dashboard"></div>');
  }
  // loadPanels() {
  // const data = new ModelData(this._viewer);
  // const data = new ZonesData(this._viewer);
  //   console.log('data');
  //   console.log(data);
  //   data.init(() => {
  //     $('#dashboard').empty();
  //     // panels are declared in the constructor as a second arguement

  //     this._panels.forEach((panel) => {
  //       // console.log(panel);
  //       // let's create a DIV with the Panel Function name and load it
  //       panel.load('dashboard', this._viewer, data);
  //     });
  //   });
  // }

  loadPanels() {
    const data = new ModelData(this._viewer);
    console.log('data');
    console.log(data);
    data.init(() => {
      $('#dashboard').empty();
      this._panels.forEach((panel) => {
        console.log(panel);
        // let's create a DIV with the Panel Function name and load it
        panel.load('dashboard', this._viewer, data);
      });
    });
  }
}
