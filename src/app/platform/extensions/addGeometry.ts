///////////////////////////////////////////////////////////////////////////////

/// <reference types="forge-viewer" />

import { Extension } from '../../viewer/extensions/extension';
// import { toolController } from 'forge-viewer';

declare const THREE: any;

export class AddGeometry extends Extension {
  // Extension must have a name
  public static extensionName: string = 'AddGeometryExtension';
  public _self = this;
  hitPoint = null;

  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
  }

  load() {
    this.viewer.toolController.registerTool(this);
    this.viewer.toolController.activateTool('DemoTool');
  }
  getNames() {
    return ['DemoTool'];
  }
  getPriority() {
    return 100;
  }

  unload() {
    console.log('AddGeometry is now unloaded!');

    this.viewer.toolbar.removeControl(this.subToolbar);

    Autodesk.Viewing.ToolController.deactivateTool('DemoTool');
    this.viewer.toolController.unregisterTool(this);

    return true;
  }
  handleMouseMove(event) {
    const screenPoint = {
      x: event.clientX,
      y: event.clientY,
    };
    const hitTest = this.viewer.impl.hitTest(screenPoint.x, screenPoint.y);
    console.log(hitTest);

    if (hitTest !== null) {
      let hitPoint = hitTest.point;
    }
    return false;
  }
  handleSingleClick(event, button) {
    const geometry = new THREE.BoxGeometry(40, 40, 40);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = this.hitPoint.x;
    mesh.position.y = this.hitPoint.y;
    mesh.position.z = this.hitPoint.z + 2;

    const materials = this.viewer.impl.getMaterials();
    materials.addMaterial('Unique Material Name', material, true);
    this.viewer.impl.scene.add(mesh);
    this.viewer.impl.sceneUpdated(true);
    return true;
  }
}
