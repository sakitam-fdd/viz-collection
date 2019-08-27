// @ts-ignore
import { renderer } from 'maptalks';

const { ImageLayerCanvasRenderer, ImageGLRenderable } = renderer;

// @ts-ignore
const EMPTY_ARRAY: any[] = [];

// @ts-ignore
// @ts-ignore
export class PlottyLayerCanvasRenderer extends ImageLayerCanvasRenderer {
  isDrawable() {
    if (this.getMap().getPitch()) {
      if (console) {
        console.warn('ImageLayer with canvas renderer can\'t be pitched, use gl renderer (\'renderer\' : \'gl\') instead.');
      }
      return false;
    }
    return true;
  }

  checkResources() {}

  // checkResources() {
  //   if (this._imageLoaded) {
  //     return EMPTY_ARRAY;
  //   }
  //   const layer = this.layer;
  //   let urls = layer._imageData.map(img => [img.url, null, null]);
  //   if (this.resources) {
  //     const unloaded = [];
  //     const resources = new ResourceCache();
  //     urls.forEach(url => {
  //       if (this.resources.isResourceLoaded(url)) {
  //         const img = this.resources.getImage(url);
  //         resources.addResource(url, img);
  //       } else {
  //         unloaded.push(url);
  //       }
  //     });
  //     this.resources.forEach((url, res) => {
  //       if (!resources.isResourceLoaded(url)) {
  //         this.retireImage(res.image);
  //       }
  //     });
  //     this.resources = resources;
  //     urls = unloaded;
  //   }
  //   this._imageLoaded = true;
  //   return urls;
  // }

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
        const image = this.resources && this.resources.getImage(imgData[i].url);
        if (image && mapExtent.intersects(extent)) {
          // @ts-ignore
          this._painted = true;
          this._drawImage(image, extent, imgData[i].opacity || 1);
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
