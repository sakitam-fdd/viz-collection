// @ts-ignore
import { CanvasLayer } from 'maptalks';

const _options = {
  renderer: 'webgl',
  doubleBuffer: false,
  animation: true,
  glOptions: {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
  },
};

class Plotty extends CanvasLayer {
  constructor(id: any, options = {}) {
    super(id, Object.assign(_options, options));
  }

  prepareToDraw() {
    return [];
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
