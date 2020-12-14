/// <reference types="forge-viewer" />

import { Extension } from '../../viewer/extensions/extension';

declare const THREE: any;

// Funktionen für asynchrones forEach
const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
};

const searchPromise = (that, args) => {
    return new Promise((resolve, reject) => {
        that.viewer.search(args, (idArray) => {
            resolve(idArray);
        }, (err) => {
            reject(false);
        }, ['name']
        );
    });
};


export class LeanBoxesExtension extends Extension {
    // Extension must have a name
    public static extensionName: string = 'LeanBoxesExtension';
    public tree;
    public frags;

    constructor(viewer, options) {
        super(viewer, options);
        this.processSelection = this.processSelection.bind(this);
        this.getObjectTree = this.getObjectTree.bind(this);
    }

    public async load() {
        console.log('LeanBoxesExtension is loaded!');
        this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
            this.getObjectTree);
        this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT,
            this.processSelection);
        return true;
    }

    unload() {
        console.log('LeanBoxesExtension is now unloaded!');
        return true;
    }

    getObjectTree() {
        this.viewer.removeEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
            this.getObjectTree);
        this.tree = this.viewer.model.getData().instanceTree;

    }

    getModifiedWorldBoundingBox(dbId) {
        var fragList = this.viewer.model.getFragmentList();
        const nodebBox = new THREE.Box3();

        // for each fragId on the list, get the bounding box
        for (const fragId of this.frags) {
            const fragbBox = new THREE.Box3();
            fragList.getWorldBounds(fragId, fragbBox);
            nodebBox.union(fragbBox); // create a unifed bounding box
        }

        return nodebBox;
    }

    processSelection(event) {
        let nodeData = {};
        if (event.nodeArray.length !== 0) {
            let selectedNode = event.nodeArray[0];
            // @ts-ignore
            nodeData.ID = selectedNode;
            // @ts-ignore
            nodeData.Name = this.findNodeNameById(selectedNode);
            // @ts-ignore
            nodeData.Parent = this.findNodeNameById(this.tree.getNodeParentId(selectedNode));
            let transMat = this.getFragmentWorldMatrixByNodeId(event.nodeArray[0]).matrix[0];

            // console.log('transMat');
            // console.log(transMat);

            // continue if it has transformation Matrix (meaning it is not a "group node")
            if (transMat) {
                // @ts-ignore
                // nodeData.position = transMat.getPosition();
                // console.log(transMat.getPosition());
                // @ts-ignore
                nodeData.position = new THREE.Vector3().setFromMatrixPosition(transMat);
                // @ts-ignore
                // console.log(nodeData.position);
            } else {
                // @ts-ignore
                nodeData.position = new THREE.Vector3();
            }
            console.log(nodeData);
            this.frags = new Array();
            // @ts-ignore
            this.tree.enumNodeFragments(nodeData.ID, (fragId) => {
                this.frags.push(fragId);
            });
            // @ts-ignore
            var a = this.getModifiedWorldBoundingBox(nodeData.ID);
            console.log(a);
            this.drawBox(a);
        }
    }

    findNodeNameById(nodeId) {
        return this.tree.getNodeName(nodeId);
    }

    getFragmentWorldMatrixByNodeId(nodeId) {
        let result = {
            fragId: [],
            matrix: [],
        };
        let viewer = this.viewer;
        this.tree.enumNodeFragments(nodeId, function (frag) {

            //@ts-ignore
            let fragProxy = viewer.impl.getFragmentProxy(viewer.model, frag);
            let matrix = new THREE.Matrix4();

            fragProxy.getWorldMatrix(matrix);

            result.fragId.push(frag);
            result.matrix.push(matrix);
        });
        return result;
    }

    drawBox(box) {
        const min = box.min;
        const max = box.max;
        const linesMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(0xFF0000),
            transparent: true,
            depthWrite: false,
            depthTest: true,
            linewidth: 10,
            opacity: 1.0
        });
        this.drawLines([

            { x: min.x, y: min.y, z: min.z },
            { x: max.x, y: min.y, z: min.z },

            { x: max.x, y: min.y, z: min.z },
            { x: max.x, y: min.y, z: max.z },

            { x: max.x, y: min.y, z: max.z },
            { x: min.x, y: min.y, z: max.z },

            { x: min.x, y: min.y, z: max.z },
            { x: min.x, y: min.y, z: min.z },

            { x: min.x, y: max.y, z: max.z },
            { x: max.x, y: max.y, z: max.z },

            { x: max.x, y: max.y, z: max.z },
            { x: max.x, y: max.y, z: min.z },

            { x: max.x, y: max.y, z: min.z },
            { x: min.x, y: max.y, z: min.z },

            { x: min.x, y: max.y, z: min.z },
            { x: min.x, y: max.y, z: max.z },

            { x: min.x, y: min.y, z: min.z },
            { x: min.x, y: max.y, z: min.z },

            { x: max.x, y: min.y, z: min.z },
            { x: max.x, y: max.y, z: min.z },

            { x: max.x, y: min.y, z: max.z },
            { x: max.x, y: max.y, z: max.z },

            { x: min.x, y: min.y, z: max.z },
            { x: min.x, y: max.y, z: max.z }],

            linesMaterial);
    }

    drawLines(coordsArray, material) {
        for (let i = 0; i < coordsArray.length; i += 2) {
            const start = coordsArray[i];
            const end = coordsArray[i + 1];
            const geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(start.x, start.y, start.z));
            geometry.vertices.push(new THREE.Vector3(end.x, end.y, end.z));
            geometry.computeLineDistances();
            const lines = new THREE.Line(geometry,
                material,
                THREE.LinePieces);
            // @ts-ignore
            if (!this.viewer.overlays.hasScene('lean-bim')) {
                // @ts-ignore
                this.viewer.overlays.addScene('lean-bim');
            }
            // @ts-ignore
            this.viewer.overlays.addMesh(lines, 'lean-bim');
        }
    }
}
