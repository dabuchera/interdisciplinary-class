///////////////////////////////////////////////////////////////////////////////

/// <reference types="forge-viewer" />

import { Extension } from '../../viewer/extensions/extension';

declare const THREE: any;

export class CoordinatesAxesExtension extends Extension {
    // Extension must have a name
    public static extensionName: string = 'CoordinatesAxesExtension';
    public _self = this;
    public _axisLines = [];

    constructor(viewer, options) {
        super(viewer, options);
        this.viewer = viewer;
    }

    load() {
        console.log('Autodesk.ADN.Viewing.Extension.AxisHelper loaded');
        setTimeout(() => {
            this.addAxisHelper();
            //workaround
            //have to call this to show up the axis
            this.viewer.restoreState(this.viewer.getState());
            
        }, 4000);
        return true; 
    }



    unload() {
        this.removeAxisHelper();
        // console.log('Autodesk.ADN.Viewing.Extension.AxisHelper unloaded');
        return true;
    }


    addAxisHelper() {

        this._axisLines = [];

        //get bounding box of the model
        console.log(this.viewer);
        var boundingBox = this.viewer.model.getBoundingBox();
        var maxpt = boundingBox.max;
        var minpt = boundingBox.min;

        var xdiff = maxpt.x - minpt.x;
        var ydiff = maxpt.y - minpt.y;
        var zdiff = maxpt.z - minpt.z;

        //make the size is bigger than the max bounding box 
        //so that it is visible 
        var size = Math.max(xdiff, ydiff, zdiff) * 1.2;
        //console.log('axix size :' + size);

        // x-axis is red
        var material_X_Axis = new THREE.LineBasicMaterial({
            color: new THREE.Color(0xFF0000), // red
            transparent: true,
            depthWrite: false,
            depthTest: true,
            linewidth: 10,
            opacity: 1.0
        });
        // this.viewer.impl.matman().addMaterial('material_X_Axis', material_X_Axis, true);
        //draw the x-axix line
        var xLine = this.drawLine(
            { x: 0, y: 0, z: 0 },
            { x: size, y: 0, z: 0 },
            'red');

        this._axisLines.push(xLine);

        // y-axis is green
        var material_Y_Axis = new THREE.LineBasicMaterial({
            color: new THREE.Color(0x00FF00), // green
            transparent: true,
            depthWrite: false,
            depthTest: true,
            linewidth: 10,
            opacity: 1.0
        });
        // this.viewer.impl.matman().addMaterial('material_Y_Axis', material_Y_Axis, true);
        //draw the y-axix line
        var yLine = this.drawLine(
            { x: 0, y: 0, z: 0 },
            { x: 0, y: size, z: 0 },
            'green');

        this._axisLines.push(yLine);

        // z-axis is blue
        var material_Z_Axis = new THREE.LineBasicMaterial({
            color: new THREE.Color(0x0000FF), // blue
            transparent: true,
            depthWrite: false,
            depthTest: true,
            linewidth: 10,
            opacity: 1.0
        });
        // this.viewer.impl.matman().addMaterial('material_Z_Axis', material_Z_Axis, true);
        //draw the z-axix line
        var zLine = this.drawLine(
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: size },
            'blue');

        this._axisLines.push(zLine);
    }


    drawLine(start, end, material) {

        var geometry = new THREE.Geometry();

        geometry.vertices.push(new THREE.Vector3(
            start.x, start.y, start.z));

        geometry.vertices.push(new THREE.Vector3(
            end.x, end.y, end.z));

        var line = new THREE.Line(geometry, material);
        // const mesh = new THREE.Mesh(geometry, material);

        if (material === 'red') {
            var linesMaterial = new THREE.LineBasicMaterial({
                color: new THREE.Color(0xFF0000),
                transparent: true,
                depthWrite: false,
                depthTest: true,
                linewidth: 10,
                opacity: 1.0
            });
        }
        else if (material === 'green') {
            var linesMaterial = new THREE.LineBasicMaterial({
                color: new THREE.Color(0x00FF00),
                transparent: true,
                depthWrite: false,
                depthTest: true,
                linewidth: 10,
                opacity: 1.0
            });
        }
        else if (material === 'blue') {
            var linesMaterial = new THREE.LineBasicMaterial({
                color: new THREE.Color(0x0000FF),
                transparent: true,
                depthWrite: false,
                depthTest: true,
                linewidth: 10,
                opacity: 1.0
            });
        }

        var lines = new THREE.Line(geometry,
            linesMaterial,
            THREE.LinePieces);

        // @ts-ignore
        if (!this.viewer.overlays.hasScene('axes')) {
            // @ts-ignore
            this.viewer.overlays.addScene('axes');
        }
        // @ts-ignore
        this.viewer.overlays.addMesh(lines, 'axes');

        // this.viewer.impl.scene.add(line);
        //refresh viewer
        // this.viewer.impl.invalidate(true);

        return line;
    }

    removeAxisHelper() {
        this._axisLines = [];
        // @ts-ignore
        this.viewer.overlays.removeScene('axes');
    }
}

 //   // This is a built-in method getHitPoint, but the original returns
    //   // the hit point, so this modified version returns the dbId
    //   public getHitDbId(x, y) {
    //     y = 1.0 - y;
    //     x = x * 2.0 - 1.0;
    //     y = y * 2.0 - 1.0;

    //     var vpVec = new THREE.Vector3(x, y, 1);

    //     var result = this.viewerComponent.viewer.impl.hitTestViewport(vpVec, false);

    //     // console.log(result);
    //     var rotation = new THREE.Euler();
    //     // console.log(rotation);
    //     // @ts-ignore
    //     rotation.setFromRotationMatrix(result.object.matrixWorld.extractRotation(result.object.matrixWorld)); // Euler
    //     // console.log(rotation);


    //     // console.log(a);

    //     // @ts-ignore
    //     // console.log(result.object.getWorldRotation());

    //     return result ? result.dbId : null;
    //   }

    //   // originally wrote by Philippe
    //   public normalize(screenPoint) {
    //     var viewport = this.viewerComponent.viewer.navigation.getScreenViewport();
    //     var n = {
    //       x: (screenPoint.x - viewport.left) / viewport.width,
    //       y: (screenPoint.y - viewport.top) / viewport.height
    //     };
    //     return n;
    //   }
