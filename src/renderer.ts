// @ts-ignore
import { renderer } from 'maptalks';
// @ts-ignore
import { plot } from 'plotty';
import { isArrayHasData } from '../stories/utils/common';
// @ts-ignore
import TiffWorker from './tiff.worker';

const { ImageLayerCanvasRenderer, ImageGLRenderable } = renderer;

// @ts-ignore
const EMPTY_ARRAY: any[] = [];

class ResourceCache {
  private _errors: any;
  private resources: any;
  constructor() {
    this.resources = {};
    this._errors = {};
  }

  addResource(url: string[], img: ImageData) {
    this.resources[url[0]] = {
      image: img,
      width: +url[1],
      height: +url[2],
    };
  }

  isResourceLoaded(url: string[] | string) {
    if (!url) {
      return false;
    }
    const imgUrl = this.getImgUrl(url);
    if (this._errors[imgUrl]) {
      return true;
    }
    return this.resources[imgUrl];
  }

  getImage(url: string[] | string) {
    const imgUrl = this.getImgUrl(url);
    if (!this.isResourceLoaded(url) || this._errors[imgUrl]) {
      return null;
    }
    return this.resources[imgUrl].image;
  }

  markErrorResource(url: string[] | string) {
    this._errors[this.getImgUrl(url)] = 1;
  }

  merge(res: any) {
    if (!res) return this;
    for (const p in res.resources) {
      const img = res.resources[p];
      this.addResource([p, img.width, img.height], img.image);
    }
    return this;
  }

  forEach(fn: (...args: any[]) => any) {
    if (!this.resources) {
      return this;
    }
    for (const p in this.resources) {
      if (this.resources.hasOwnProperty(p)) {
        fn(p, this.resources[p]);
      }
    }
    return this;
  }

  getImgUrl(url: string[] | string) {
    if (!Array.isArray(url)) {
      return url;
    }
    return url[0];
  }
}

// @ts-ignore
// @ts-ignore
export class PlottyLayerCanvasRenderer extends ImageLayerCanvasRenderer {
  private worker: Worker | undefined;
  private plotty: plot;
  isDrawable() {
    if (this.getMap().getPitch()) {
      if (console) {
        console.warn('ImageLayer with canvas renderer can\'t be pitched, use gl renderer (\'renderer\' : \'gl\') instead.');
      }
      return false;
    }
    return true;
  }

  checkResources() {
    if (this._imageLoaded) {
      return EMPTY_ARRAY;
    }
    const layer = this.layer;
    let urls = layer._imageData.map((img: { url: any; }) => img.url);
    if (this.resources) {
      const unloaded: any[] | never[] = [];
      const resources = new ResourceCache();
      urls.forEach((url: any) => {
        if (this.resources.isResourceLoaded(url)) {
        } else {
          // @ts-ignore
          unloaded.push(url);
        }
      });
      this.resources.forEach((url: any, res: { image: any; }) => {
        if (!resources.isResourceLoaded(url)) {
          // @ts-ignore
          this.retireImage(res.image);
        }
      });
      // @ts-ignore
      this.resources = resources;
      urls = unloaded;
    }
    // @ts-ignore
    this._imageLoaded = true;
    return urls;
  }

  loadResources(resourceUrls: any) {
    if (!this.resources) {
      // @ts-ignore
      this.resources = new ResourceCache();
    }
    const resources = this.resources;
    const promises = [];
    if (isArrayHasData(resourceUrls)) {
      const cache = {};
      for (let i = resourceUrls.length - 1; i >= 0; i--) {
        const url = resourceUrls[i];
        if (!url || !url.length || cache[url.join('-')]) {
          continue;
        }
        cache[url.join('-')] = 1;
        if (!resources.isResourceLoaded(url, true)) {
          promises.push(new Promise(this._promiseResource(url)));
        }
      }
    }
    return Promise.all(promises);
  }

  retireImage(/* image */) {

  }

  // refreshImages() {
  //   this._imageLoaded = false;
  //   this.setToRedraw();
  // }

  needToRedraw() {
    const map = this.getMap();
    // don't redraw when map is zooming without pitch and layer doesn't have any point symbolizer.
    if (map.isZooming() && !map.getPitch()) {
      return false;
    }
    return super.needToRedraw();
  }

  draw() {
    if (!this.isDrawable()) return;
    // @ts-ignore
    this.prepareCanvas();
    // @ts-ignore
    this._painted = false;
    this._drawImages();
    // @ts-ignore
    this.completeRender();
  }

  // tslint:disable-next-line:function-name
  _drawImages() {
    // @ts-ignore
    const imgData = this.layer._imageData;
    const map = this.getMap();
    const mapExtent = map._get2DExtent(map.getGLZoom());
    if (imgData && imgData.length) {
      for (let i = 0; i < imgData.length; i++) {
        const extent = imgData[i].extent2d;
        // @ts-ignore
        // const image = this.resources && this.resources.getImage(imgData[i].url);
        if (this.plotty && mapExtent.intersects(extent)) {
          // @ts-ignore
          this._painted = true;
          this._drawImage(this.plotty.gl.canvas, extent, imgData[i].opacity || 1);
        }
      }
    }
  }

  // tslint:disable-next-line:function-name
  _drawImage(image: HTMLImageElement, extent: any, opacity: number) {
    let globalAlpha = 0;
    // @ts-ignore
    const ctx = this.context;
    if (opacity < 1) {
      globalAlpha = ctx.globalAlpha;
      ctx.globalAlpha = opacity;
    }
    const map = this.getMap();
    const min = extent.getMin();
    const max = extent.getMax();
    const point = map._pointToContainerPoint(min, map.getGLZoom());
    let x = point.x;
    let y = point.y;
    const bearing = map.getBearing();
    if (bearing) {
      ctx.save();
      ctx.translate(x, y);
      if (bearing) {
        ctx.rotate(-bearing * Math.PI / 180);
      }
      x = y = 0;
    }
    const scale = map.getGLScale();
    ctx.drawImage(image, x, y, (max.x - min.x) / scale, (max.y - min.y) / scale);
    if (bearing) {
      ctx.restore();
    }
    if (globalAlpha) {
      ctx.globalAlpha = globalAlpha;
    }
  }

  drawOnInteracting() {
    this.draw();
  }

  onMessage({ data: payload }: any) {
    console.log(payload, this.layer);
    // @ts-ignore
    this._loadingResource = false;
    if (this.layer) {
      const first = payload.data[0];

      // addColorScale("scale", colors, values);

      this.plotty = new plot({
        canvas: new OffscreenCanvas(first.width, first.height),
        data: first.data,
        width: first.width,
        height: first.height,
        domain: [-73.6137, 42.9801],
        colorScale: 'rainbow',
      });
      this.layer.fire('resourceload', payload);
      this.setToRedraw();
      this.plotty.render();
    }
  }

  render(framestamp: number) {
    this.prepareRender();
    if (!this.getMap() || !this.layer.isVisible()) {
      return;
    }

    if (!this.worker) {
      this.worker = new TiffWorker();

      if (!this.worker) return;
      this.worker.addEventListener('message', this.onMessage.bind(this));
    }
    if (!this.resources) {
      // @ts-ignore
      this.resources = new ResourceCache();
    }

    if (this.plotty) {
      this.plotty.render();
    }

    if (this.checkResources) {
      const resources = this.checkResources();
      if (resources.length > 0) {
        // @ts-ignore
        this._loadingResource = true;
        this.worker.postMessage(resources);
      } else {
        this._tryToDraw(framestamp);
      }
    } else {
      this._tryToDraw(framestamp);
    }
  }

  getMap() {
    return super.getMap();
  }
}

export class PlottyLayerGLRenderer extends ImageGLRenderable(PlottyLayerCanvasRenderer) {
  /**
   * set layer draw able
   */
  isDrawable() {
    return true;
  }

  // tslint:disable-next-line:function-name
  _drawImage(image: any, extent: any, opacity: number) {
    this.drawGLImage(image, extent.xmin, extent.ymin, extent.getWidth(), extent.getHeight(), opacity);
  }

  createContext() {
    // @ts-ignore
    this.createGLContext();
  }

  resizeCanvas(canvasSize: any) {
    // @ts-ignore
    if (!this.canvas) {
      return;
    }
    super.resizeCanvas(canvasSize);
    // @ts-ignore
    this.resizeGLCanvas();
  }

  clearCanvas() {
    // @ts-ignore
    if (!this.canvas) {
      return;
    }
    super.clearCanvas();
    // @ts-ignore
    this.clearGLCanvas();
  }

  retireImage(image: any) {
    this.disposeImage(image);
  }

  onRemove() {
    this.removeGLCanvas();
    super.onRemove();
  }

  disposeImage(...args: any[]) {
    return super.disposeImage(...args);
  }

  drawGLImage(...args: any[]) {
    return super.drawGLImage(...args);
  }

  removeGLCanvas() {
    return super.removeGLCanvas();
  }
}
