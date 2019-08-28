// @ts-ignore
import { Map, CanvasLayer, MultiPolygon, Util, Coordinates, renderer } from 'maptalks';
// @ts-ignore
import * as THREE from 'three';

const _options = {
  renderer: 'gl',
  doubleBuffer: false,
  glOptions: null,
};

const RADIAN = Math.PI / 180;

function getTargetZoom(map: Map) {
  return map.getGLZoom();
}

export default class ThreeLayer extends CanvasLayer {
  constructor(id: string | number, options: any) {
    super(id, Object.assign({}, _options, options));
  }

  draw() {
    this.renderScene();
  }

  drawOnInteracting() {
    this.renderScene();
  }

  prepareToDraw() {}

  coordinateToVector3(coordinate: any, z = 0) {
    const map = this.getMap();
    if (!map) {
      return null;
    }
    const p = map.coordinateToPoint(coordinate, getTargetZoom(map));
    return new THREE.Vector3(p.x, p.y, z);
  }

  distanceToVector3(w: number, h: number, coord?: number[] | Coordinates) {
    const map = this.getMap();
    const zoom = getTargetZoom(map);
    const center = coord || map.getCenter();
    const target = map.locate(center, w, h);
    const p0 = map.coordinateToPoint(center, zoom);
    const p1 = map.coordinateToPoint(target, zoom);
    const x = Math.abs(p1.x - p0.x) * Util.sign(w);
    const y = Math.abs(p1.y - p0.y) * Util.sign(h);
    return new THREE.Vector3(x, y, 0);
  }

  toShape(polygon: any) {
    if (!polygon) return null;
    if (polygon instanceof MultiPolygon) {
      return polygon.getGeometries().map((c: any) => this.toShape(c));
    }
    const center = polygon.getCenter();
    const centerPt = this.coordinateToVector3(center);
    const shell = polygon.getShell();
    const outer = shell.map((c: any) => this.coordinateToVector3(c).sub(centerPt)).reverse();
    const shape = new THREE.Shape(outer);
    const holes = polygon.getHoles();

    if (holes && holes.length > 0) {
      shape.holes = holes.map((item: any) => {
        const pts = item.map((c: any) => this.coordinateToVector3(c).sub(centerPt));
        return new THREE.Shape(pts);
      });
    }

    return shape;
  }

  toExtrudeMesh(polygon: any, altitude: number, material: any, height: any) {
    if (!polygon) return null;
    if (polygon instanceof MultiPolygon) {
      return polygon.getGeometries().map((c: any) => this.toExtrudeMesh(c, altitude, material, height));
    }
    const rings = polygon.getCoordinates();
    rings.forEach((ring: any[]) => {
      const length = ring.length;
      for (let i = length - 1; i >= 1; i--) {
        if (ring[i].equals(ring[i - 1])) {
          ring.splice(i, 1);
        }
      }
    });
    polygon.setCoordinates(rings);
    const shape = this.toShape(polygon);
    const center = this.coordinateToVector3(polygon.getCenter());
    const tempH = Util.isNumber(height) ? height : altitude;
    const resHeight = this.distanceToVector3(tempH, tempH).x;
    const amount = this.distanceToVector3(altitude, altitude).x;
    // { amount: extrudeH, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
    const config = { bevelEnabled: false, bevelSize : 1 };
    // tslint:disable-next-line:radix
    const name = parseInt(THREE.REVISION) >= 93 ? 'depth' : 'amount';
    config[name] = height;
    const geom = new THREE.ExtrudeGeometry(shape, config);
    const buffGeom = new THREE.BufferGeometry();
    buffGeom.fromGeometry(geom);
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.set(center.x, center.y, amount - resHeight);
    return mesh;
  }

  /**
   * clear mesh
   */
  clearMesh() {
    const scene = this.getScene();
    if (!scene) return this;
    for (let i = scene.children.length - 1; i >= 0; i--) {
      if (scene.children[i] instanceof THREE.Mesh) {
        scene.remove(scene.children[i]);
      }
    }
    return this;
  }

  lookAt(vector: any) {
    const renderer = this._getRenderer();
    if (renderer) {
      renderer.context.lookAt(vector);
    }
    return this;
  }

  getCamera() {
    const renderer = this._getRenderer();
    if (renderer) {
      return renderer.camera;
    }
    return null;
  }

  getScene() {
    const renderer = this._getRenderer();
    if (renderer) {
      return renderer.scene;
    }
    return null;
  }

  renderScene() {
    const renderer = this._getRenderer();
    if (renderer) {
      return renderer.renderScene();
    }
    return this;
  }

  /**
   * 获取 render
   */
  getThreeRenderer() {
    const renderer = this._getRenderer();
    if (renderer) {
      return renderer.context;
    }
    return null;
  }

  /**
   * To make map's 2d point's 1 pixel euqal with 1 pixel on XY plane in THREE's scene:
   * 1. fov is 90 and camera's z is height / 2 * scale,
   * 2. if fov is not 90, a ratio is caculated to transfer z to the equivalent when fov is 90
   * @return {Number} fov ratio on z axis
   */
  // tslint:disable-next-line:function-name
  _getFovRatio() {
    const map = this.getMap();
    const fov = map.getFov();
    return Math.tan(fov / 2 * RADIAN);
  }

  // tslint:disable-next-line:function-name
  _getRenderer() {
    return super._getRenderer();
  }

  /**
   * get map
   * @return {Map} maptalks map
   */
  getMap() {
    return super.getMap();
  }
}

export class ThreeRenderer extends renderer.CanvasLayerRenderer {
  getPrepareParams() {
    // @ts-ignore
    return [this.scene, this.camera];
  }

  getDrawParams() {
    // @ts-ignore
    return [this.scene, this.camera];
  }

  // tslint:disable-next-line:function-name
  _drawLayer() {
    super._drawLayer.apply(this, arguments);
    this.renderScene();
  }

  hitDetect() {
    return false;
  }

  createCanvas() {
    super.createCanvas();
    this.createContext();
  }

  createContext() {
    // @ts-ignore
    if (this.canvas.gl && this.canvas.gl.wrap) {
      // @ts-ignore
      this.gl = this.canvas.gl.wrap();
    } else {
      // @ts-ignore
      const layer = this.layer;
      const attributes = layer.options.glOptions || {
        alpha: true,
        depth: true,
        antialias: true,
        stencil : true,
      };
      attributes.preserveDrawingBuffer = true;
      // @ts-ignore
      this.gl = this.gl || this._createGLContext(this.canvas, attributes);
    }
    this._initThreeRenderer();
    // @ts-ignore
    this.layer.onCanvasCreate(this.context, this.scene, this.camera);
  }

  // tslint:disable-next-line:function-name
  _initThreeRenderer() {
    // @ts-ignore
    const renderer = new THREE.WebGLRenderer({ context : this.gl, alpha : true });
    renderer.autoClear = false;
    renderer.setClearColor(new THREE.Color(1, 1, 1), 0);
    // @ts-ignore
    renderer.setSize(this.canvas.width, this.canvas.height);
    renderer.clear();
    // @ts-ignore
    renderer.canvas = this.canvas;
    // @ts-ignore
    this.context = renderer;
    // @ts-ignore
    const scene = this.scene = new THREE.Scene();
    // @ts-ignore
    const map = this.layer.getMap();
    const fov = map.getFov() * Math.PI / 180;
    // @ts-ignore
    this.camera = new THREE.PerspectiveCamera(fov, map.width / map.height, map.cameraNear, map.cameraFar);
    // @ts-ignore
    this.camera.matrixAutoUpdate = false;
    this._syncCamera();
    // @ts-ignore
    scene.add(this.camera);
  }

  onCanvasCreate() {
    super.onCanvasCreate();
  }

  resizeCanvas(canvasSize: any) {
    // @ts-ignore
    const map = this.getMap();
    // @ts-ignore
    // tslint:disable-next-line:no-this-assignment
    const { canvas } = this;
    if (!canvas) return;
    let size;
    if (!canvasSize) {
      size = map.getSize();
    } else {
      size = canvasSize;
    }
    const r = map.getDevicePixelRatio();
    // retina support
    canvas.height = r * size['height'];
    canvas.width = r * size['width'];
    // @ts-ignore
    this.context.setSize(canvas.width, canvas.height);
  }

  clearCanvas() {
    // @ts-ignore
    if (!this.canvas) return;
    // @ts-ignore
    this.context.clear();
  }

  prepareCanvas() {
    // @ts-ignore
    if (!this.canvas) {
      this.createCanvas();
    } else {
      this.clearCanvas();
    }
    // @ts-ignore
    this.layer.fire('renderstart', { context : this.context });
    return null;
  }

  renderScene() {
    this._syncCamera();
    // @ts-ignore
    this.context.render(this.scene, this.camera);
    // @ts-ignore
    this.completeRender();
  }

  remove() {
    // @ts-ignore
    delete this._drawContext;
    super.remove();
  }

  // tslint:disable-next-line:function-name
  _syncCamera() {
    // @ts-ignore
    const map = this.getMap();
    // @ts-ignore
    this.camera.matrix.elements = map.cameraWorldMatrix;
    // @ts-ignore
    this.camera.projectionMatrix.elements = map.projMatrix;
  }

  // tslint:disable-next-line:function-name
  _createGLContext(canvas: HTMLCanvasElement, options: any) {
    const names = ['webgl', 'experimental-webgl'];
    let context = null;
    for (let i = 0; i < names.length; ++i) {
      try {
        context = canvas.getContext(names[i], options);
      } catch (e) {}
      if (context) {
        break;
      }
    }
    return context;
  }
}

// @ts-ignore
ThreeLayer.registerRenderer('gl', ThreeRenderer);
