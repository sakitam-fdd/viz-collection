import { Canvas as Canvas2D, renderer, Extent } from 'maptalks';

const { TileLayerCanvasRenderer, TileLayerGLRenderer } = renderer;

function loadTile(tile) {
  const tileSize = this.layer.getTileSize();
  const canvasClass = this.canvas.constructor;
  const map = this.getMap();
  const r = map.getDevicePixelRatio();
  const tileCanvas = Canvas2D.createCanvas(tileSize.width * r, tileSize.height * r, canvasClass);
  tileCanvas.layer = this.layer;
  const me = this;
  const extent = new Extent(map.pointToCoordinate(tile.point), map.pointToCoordinate(tile.point.add(tileSize.toPoint())), map.getProjection());
  this.layer.drawTile(tileCanvas, {
    url: tile.url,
    point: tile.point,
    center: map.pointToCoordinate(tile.point.add(tileSize.width / 2, tileSize.height / 2)),
    extent,
    z: tile.z,
    x: tile.x,
    y: tile.y,
  }, error => {
    if (error) {
      me.onTileError(tileCanvas, tile);
      return;
    }
    me.onTileLoad(tileCanvas, tile);
  });
  return tileCanvas;
}

class CanvasRenderer extends TileLayerCanvasRenderer {
  loadTile(...args) {
    return loadTile.call(this, ...args);
  }
}

class GLRenderer extends TileLayerGLRenderer {
  loadTile(...args) {
    return loadTile.call(this, ...args);
  }
}

export {
  CanvasRenderer,
  GLRenderer,
};
