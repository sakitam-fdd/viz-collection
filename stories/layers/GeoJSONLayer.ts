import { isNumber } from 'lodash-es';
// @ts-ignore
import { TileLayer, Size } from 'maptalks';
import { CanvasRenderer, GLRenderer } from './renderer/GeoJSONLayer';
// @ts-ignore
import TileWorker from '../worker/tile.worker';

class GeoJSONTileLayer extends TileLayer {
  private options: any;
  private _style: {
    lineDashOffset: number;
    textBaseline: string;
    shadowOffsetX: number;
    strokeStyle: string;
    shadowOffsetY: number;
    imageSmoothingEnabled: boolean;
    shadowBlur: number;
    textAlign: string;
    globalCompositeOperation: string;
    lineJoin: string;
    miterLimit: number;
    lineWidth: number;
    lineCap: string;
    globalAlpha: number;
    fillStyle: string;
    shadowColor: string;
    font: string;
  };
  private worker: Worker | undefined;
  constructor(id: string | number, data?: any, options?: any) {
    super(id, options);
    if (!this.options.hasOwnProperty('forceRenderOnMoving')) {
      // force not to forceRenderOnMoving
      this.options.forceRenderOnMoving = false;
    }

    this._style = {
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      strokeStyle: '#404a59',
      fillStyle: 'rgba(0,195,93,0.81)',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      shadowColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      lineDashOffset: 0,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
    };

    if (data) {
      this.initialize(data);
    }
  }

  initialize(data: any) {
    this.worker = new TileWorker();

    const options = {};
    Object.keys(this.options).forEach((key: string | number) => {
      if (
        key !== 'rendererFactory' &&
        key !== 'styles' &&
        typeof this.options[key] !== 'function'
      ) {
        options[key] = this.options[key];
      }
    });

    if (this.worker) {
      this.worker.postMessage(['slice', data, options]);
    }
  }

  getTileUrl() {}

  getTileSize() {
    // @ts-ignore
    let size = this.options.tileSize;
    if (isNumber(size)) {
      size = [size, size];
    }
    return new Size(size);
  }

  getVectorTilePromise(coords: any, extent?: number[]) {
    // @ts-ignore
    const that = this;

    const p = new Promise((resolve: any) => {
      this.worker && this.worker.addEventListener('message', function recv(m) {
        if (
          m.data.coords &&
          m.data.coords.x === coords.x &&
          m.data.coords.y === coords.y &&
          m.data.coords.z === coords.z
        ) {
          resolve(m.data, extent);
          that.worker && that.worker.removeEventListener('message', recv);
        }
      });
    });

    this.worker && this.worker.postMessage(['get', coords]);

    return p;
  }

  // eslint-disable-next-line no-unused-vars
  drawTile(canvas: HTMLCanvasElement, tileContext: any, onComplete: (...args: any[]) => any) {
    const extent = tileContext.extent;
    const s = this.getTileSize().toArray();
    const map = this.getMap();
    const r = map.getDevicePixelRatio();
    const coords = {
      x: tileContext.x,
      y: tileContext.y,
      z: tileContext.z,
    };

    const size = [s[0] * r, s[1] * r];

    const vectorTilePromise = this.getVectorTilePromise(coords, [
      extent.xmin,
      extent.ymin,
      extent.xmax,
      extent.ymax,
    ]);

    vectorTilePromise.then((vectorTile: any) => {
      if (vectorTile.layers && vectorTile.layers.length !== 0) {
        Object.keys(vectorTile.layers).forEach((key: string) => {
          const layer = vectorTile.layers[key];
          // FIXME: https://github.com/Leaflet/Leaflet/blob/master/src/geometry/Point.js#L78
          const ext = layer.extent || 4096;
          const pxPerExtent = [size[0] / ext, size[1] / ext];
          this.renderShape(canvas, layer.features, pxPerExtent);
          onComplete();
        });
      }
    });
  }

  /**
   * re render
   */
  renderShape(canvas: HTMLCanvasElement, features: any, scale: number[]) {
    // @ts-ignore
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    Object.keys(this._style).forEach((key: string) => {
      context[key] = this._style[key];
    });

    for (let i = 0; i < features.length; i++) {
      const item = features[i];
      context.save();
      if (item.fillStyle) {
        context.fillStyle = item.fillStyle;
      }
      if (item.strokeStyle) {
        context.strokeStyle = item.strokeStyle;
      }
      const type = item.geometry.type;
      context.beginPath();
      this.drawInternal(context, item, scale);
      if (type === 'Point' || type === 'Polygon' || type === 'MultiPolygon') {
        context.fill();
        context.stroke();
      } else if (type === 'LineString') {
        if (item.lineWidth) {
          context.lineWidth = item.lineWidth;
        }
        context.stroke();
      }
      context.restore();
    }
    context.restore();
  }

  /**
   * draw vector shape
   * @param context
   * @param data
   * @param scale
   * @private
   */
  drawInternal(context: CanvasRenderingContext2D, data: any, scale: number[]) {
    const type = data.geometry.type;
    const coordinates = data.geometry.coordinates;
    let pixel = [];
    switch (type) {
      case 'Point': {
        const size = data._size || data.size || 5;
        // https://github.com/Leaflet/Leaflet/blob/master/src/geometry/Point.js#L101
        pixel = [coordinates[0] * scale[0], coordinates[1] * scale[1]];
        context.moveTo(pixel[0], pixel[1]);
        context.arc(pixel[0], pixel[1], size, 0, Math.PI * 2);
        break;
      }
      case 'LineString':
        for (let j = 0; j < coordinates.length; j++) {
          pixel = [coordinates[j][0] * scale[0], coordinates[j][1] * scale[1]];
          if (j === 0) {
            context.moveTo(pixel[0], pixel[1]);
          } else {
            context.lineTo(pixel[0], pixel[1]);
          }
        }
        break;
      case 'Polygon':
        this.drawPolygon(context, coordinates, scale);
        break;
      case 'MultiPolygon':
        for (let i = 0; i < coordinates.length; i++) {
          const polygon = coordinates[i];
          this.drawPolygon(context, polygon, scale);
        }
        context.closePath();
        break;
      default:
        console.log(`type${type}is not support now!`);
        break;
    }
  }

  /**
   * draw polygon
   * @param context
   * @param coordinates
   * @param scale
   * @private
   */
  drawPolygon(context: CanvasRenderingContext2D, coordinates: any[], scale: number[]) {
    // tslint:disable-next-line:variable-name
    let pixel;
    // tslint:disable-next-line:variable-name
    let pixel_;
    for (let i = 0; i < coordinates.length; i++) {
      const coordinate = coordinates[i];
      pixel = [coordinate[0] * scale[0], coordinate[1] * scale[1]];
      context.moveTo(pixel[0], pixel[1]);
      for (let j = 1; j < coordinate.length; j++) {
        pixel_ = [coordinate[j][0] * scale[0], coordinate[j][1] * scale[1]];
        context.lineTo(pixel_[0], pixel_[1]);
      }
      context.lineTo(pixel[0], pixel[1]);
    }
  }

  onRemove() {
    if (this.worker) {
      this.worker.terminate();
    }

    super.onRemove();
  }

  config(...args: any[]) {
    return super.config(...args);
  }

  getId() {
    return super.getId();
  }

  getMap() {
    return super.getMap();
  }

  toJSON() {
    return {
      type: 'GeoJSONTileLayer',
      id: this.getId(),
      options: this.config(),
    };
  }

  static fromJSON(layerJSON: any) {
    if (!layerJSON || layerJSON.type !== 'VectorTileLayer') {
      return null;
    }
    return new GeoJSONTileLayer(layerJSON.id, layerJSON.options);
  }
}

// @ts-ignore
GeoJSONTileLayer.registerRenderer('canvas', CanvasRenderer);
// @ts-ignore
GeoJSONTileLayer.registerRenderer('gl', GLRenderer);

export default GeoJSONTileLayer;
