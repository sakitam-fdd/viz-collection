// @ts-ignore
import { Layer, Extent } from 'maptalks';

const _options = {
  doubleBuffer: false,
  glOptions: {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
  },
};

class Plotty extends Layer {
  private _images: any[];
  // @ts-ignore
  private _imageData: any[] | undefined;
  constructor(id: string | number | symbol, tiff: any[], options: any) {
    // if (tiff && !Array.isArray(tiff) && !tiff.url) {
    //   options = tiff;
    // }
    super(id, Object.assign({}, options, _options));
    this._images = tiff;
  }

  onAdd() {
    this._prepareImages(this._images);
  }

  /**
   * Set images and redraw
   * @param {Object[]} images - new images
   * @return {ImageLayer} this
   */
  setImages(images: any[]) {
    this._images = images;
    this._prepareImages(images);
    return this;
  }

  /**
   * Get images
   * @return {Object[]}
   */
  getImages() {
    return this._images;
  }

  // tslint:disable-next-line:function-name
  _prepareImages(images: any[] = []) {
    if (!Array.isArray(images)) {
      // tslint:disable-next-line:no-parameter-reassignment
      images = [images];
    }
    const map = this.getMap();
    this._imageData = images.map((img: any) => {
      const extent = new Extent(img.extent);
      return Object.assign({}, img, {
        extent,
        extent2d: extent.convertTo((c: any) => map.coordToPoint(c, map.getGLZoom())),
      });
    });
    this._images = images;
    const renderer = this.getRenderer();
    if (renderer) {
      renderer.refreshImages();
    }
  }

  onResize() {
    super.onResize();
  }

  remove() {
    super.remove();
  }
}

// @ts-ignore
// Plotty.registerRenderer('webgl', Renderer);

export {
  Plotty,
};
