// @ts-ignore
import Pbf from 'pbf';
// @ts-ignore
import GeoJSONVt from 'geojson-vt';
// @ts-ignore
import { VectorTile as Tile, VectorTileFeature } from '@mapbox/vector-tile';
import {
  Canvas as Canvas2D, Extent,
  Map, Point, Polygon, renderer,
  Size, TileLayer, Util, VectorLayer,
  MultiPolygon,
  // @ts-ignore
} from 'maptalks';
import { replacer } from '../utils/common';

const { isNumber } = Util;
const {
  CanvasTileLayerCanvasRenderer,
  CanvasTileLayerGLRenderer,
} = renderer;

// const MAX_VISIBLE_SIZE = 5;

function err(...args: any[]) {
  return new Error(args.join(': '));
}

function load(url: string) {
  // eslint-disable-next-line consistent-return
  return fetch(url).then((response: any) => {
    if (response.ok) {
      return response.arrayBuffer();
    }
    if (response.status !== 404) {
      throw err(url, response.status, response.statusText);
    }
  });
}

const defaultOptions = {
  mode: 'mvt',
};

class VectorTile extends TileLayer {
  private _layer: VectorLayer;
  private vt: GeoJSONVt;

  constructor(id: string, data: any, options = {}) {
    super(id, Object.assign({}, defaultOptions, options));

    this._layer = new VectorLayer(`${id}_vector`, null, options);

    if (data) {
      this.initialize(data);
    }
  }

  initialize(data: any) {
    this.vt = GeoJSONVt(data, {
      // maxZoom: 16,  // max zoom to preserve detail on; can't be higher than 24
      // tolerance: 0.5, // simplification tolerance (higher means simpler)
      extent: 4096, // tile extent (both width and height)
      // buffer: 64,   // tile buffer on each side
      // debug: 1,     // logging level (0 to disable, 1 or 2)
      // lineMetrics: false, // whether to enable line metrics tracking for LineString/MultiLineString features
      // promoteId: null,    // name of a feature property to promote to feature.id. Cannot be used with `generateId`
      // generateId: false,  // whether to generate feature ids. Cannot be used with `promoteId`
      // indexMaxZoom: 5,
    });
  }

  getTileUrl(...args: any[]) {
    // @ts-ignore
    const { mode } = this.options;
    if (mode === 'mvt') { // 矢量瓦片
      return super.getTileUrl(...args);
    }
    if (mode === 'geojson-vt') { // 超大型 GeoJSON 分片加载渲染
      return;
    }
  }

  /**
   * 获取瓦片大小
   */
  getTileSize() {
    // @ts-ignore
    let size = this.options.tileSize;
    if (isNumber(size)) {
      size = [size, size];
    }
    return new Size(size);
  }

  /**
   * mvt 数据要素解析
   * @param feature
   * @param scale
   * @param containerPoint
   * @param layerName
   */
  loadGeometryForMVT(feature: any, scale: number[], containerPoint: any, layerName: string | number) {
    const geom = feature.loadGeometry();
    const type = VectorTileFeature.types[feature.type];

    const map = this.getMap();
    const tilePoints = [];
    if (Array.isArray(geom)) {
      for (let i = 0, len = geom.length; i < len; i++) {
        const item = geom[i];
        if (Array.isArray(item)) {
          const point = [];

          for (let j = 0, len = item.length; j < len; j++) {
            const el = item[j];
            point.push(
              map.containerPointToCoordinate(containerPoint.add(new Point([el.x * scale[0], el.y * scale[1]]))),
            );
          }

          tilePoints.push(point);
        } else {
          tilePoints.push(
            map.containerPointToCoordinate(containerPoint.add(new Point([item.x * scale[0], item.y * scale[1]]))),
          );
        }
      }
    } else if (geom.x && geom.y) {
      tilePoints.push(
        map.containerPointToCoordinate(containerPoint.add(new Point([geom.x * scale[0], geom.y * scale[1]]))),
      );
    }

    if (type === 'Polygon') {
      const polygon = new Polygon(tilePoints);
      polygon.setProperties(Object.assign(feature.properties, {
        layerName,
      }) || {});
      return polygon;
    }
  }

  /**
   * geojson vt 要素解析
   * @param feature
   * @param scale
   * @param containerPoint
   */
  loadGeometryForGVT(feature: any, scale: number[], containerPoint: any) {
    const geom = feature.geometry.coordinates;
    const type = feature.geometry.type;
    const map = this.getMap();
    const tilePoints = [];
    if (type === 'Polygon') {
      if (Array.isArray(geom)) {
        for (let i = 0, len = geom.length; i < len; i++) {
          const item = geom[i];
          if (Array.isArray(item)) {
            const point = [];

            for (let j = 0, len = item.length; j < len; j++) {
              const el = item[j];
              point.push(map.containerPointToCoordinate(
                containerPoint.add(new Point([el[0] * scale[0], el[1] * scale[1]])),
              ));
            }

            tilePoints.push(point);
          } else {
            tilePoints.push(map.containerPointToCoordinate(
              containerPoint.add(new Point([item[0] * scale[0], item[1] * scale[1]])),
            ));
          }
        }
      }
      const polygon = new Polygon(tilePoints);
      polygon.setProperties(Object.assign(feature.properties, {
        // layerName,
      }) || {});
      return polygon;
    }
    if (type === 'MultiPolygon') {
      if (Array.isArray(geom)) {
        for (let i = 0, len = geom.length; i < len; i++) {
          const item = geom[i];
          if (Array.isArray(item)) {
            const point = [];

            for (let j = 0, len = item.length; j < len; j++) {
              const el = item[j];
              const sec = [];
              for (let k = 0, len = el.length; k < len; k++) {
                const pt = el[k];
                sec.push(
                  map.containerPointToCoordinate(
                    containerPoint.add(new Point([pt[0] * scale[0], pt[1] * scale[1]])),
                  ),
                );
              }

              point.push(sec);
            }

            tilePoints.push(point);
          } else {
            tilePoints.push(map.containerPointToCoordinate(
              containerPoint.add(new Point([item[0] * scale[0], item[1] * scale[1]]))),
            );
          }
        }
      }
      const multiPolygon = new MultiPolygon(tilePoints);
      multiPolygon.setProperties(Object.assign(feature.properties, {
      }) || {});
      return multiPolygon;
    }
  }

  /**
   * 默认以矢量瓦片方式加载
   * @param tileCanvas
   * @param tile
   * @param containerPoint
   * @param onComplete
   */
  createMVTTile(tileCanvas: HTMLCanvasElement, tile: any, containerPoint: any, onComplete: (...args: any[]) => void) {
    // @ts-ignore
    const { style } = this.options;
    load(tile.url).then((buffer) => {
      const data = new Tile(new Pbf(buffer));
      const size = [tileCanvas.width, tileCanvas.height];
      const layers: any[] = [];
      let loaded = 0;
      function onLayerLoaded() {
        loaded++;
        if (loaded === layers.length) {
          onComplete(null);
        }
      }
      Object.keys(data.layers).forEach((layerName: string | number) => {
        const tileLayer = data.layers[layerName];
        const geometries = [];

        let i = 0;
        while (i !== tileLayer.length) {
          const geometry = this.loadGeometryForMVT(
            tileLayer.feature(i),
            [
              size[0] / tileLayer.extent,
              size[1] / tileLayer.extent,
            ],
            containerPoint,
            layerName,
          );
          geometries.push(geometry);
          // this.addGeometry(tileLayer.feature(i), tileLayer.extent / size.width, containerPoint, layerName);
          i += 1;
        }
        layers.push(
          new VectorLayer(layerName, geometries.filter(geo => !!geo), {
            style,
            enableSimplify: false,
            geometryEvents: false,
          }).on('layerload', onLayerLoaded),
        );
      });

      new Map(tileCanvas, {
        layers,
        center: tile.center,
        zoom: tile.z,
      });
    });
  }

  createGVTTile(tileCanvas: HTMLCanvasElement, tile: any, containerPoint: any, onComplete: (...args: any[]) => void) {
    // @ts-ignore
    const { style } = this.options;
    const { z, x, y } = tile;
    const data = this.vt.getTile(z, x, y);
    const extent = data.extent || 4096;

    const featureString = JSON.stringify({
      type: 'FeatureCollection',
      features: data ? data.features : [],
    }, replacer);

    const collection = JSON.parse(featureString);

    const size = [tileCanvas.width, tileCanvas.height];
    const layers: any[] = [];
    let loaded = 0;
    function onLayerLoaded() {
      loaded++;
      if (loaded === layers.length) {
        onComplete(null);
      }
    }
    const geometries = [];

    let i = 0;
    while (i !== collection.features.length) {
      const geometry = this.loadGeometryForGVT(
        collection.features[i],
        [
          size[0] / extent,
          size[1] / extent,
        ],
        containerPoint,
      );
      geometries.push(geometry);
      i += 1;
    }
    layers.push(
      new VectorLayer('test', geometries, {
        style,
        enableSimplify: false,
        geometryEvents: false,
      }).on('layerload', onLayerLoaded),
    );

    new Map(tileCanvas, {
      layers,
      center: tile.center,
      zoom: tile.z,
    });
  }

  createTile(tileCanvas: HTMLCanvasElement, tile: any, containerPoint: any, onComplete: (...args: any[]) => void) {
    // @ts-ignore
    const { mode } = this.options;
    if (mode === 'mvt') { // 矢量瓦片
      this.createMVTTile(tileCanvas, tile, containerPoint, onComplete);
    } else if (mode === 'geojson-vt') { // 超大型 GeoJSON 分片加载渲染
      this.createGVTTile(tileCanvas, tile, containerPoint, onComplete);
    }
  }

  onAdd() {
    const map = this.getMap();
    if (map) {
      map.addLayer(this._layer);
    }
  }

  drawTile(tileCanvas: HTMLCanvasElement, tileContext: any, onComplete: () => void) {
    const map = this.getMap();
    const { point, z } = tileContext;
    const containerPoint = map._pointToContainerPoint(point, z);
    this.createTile(tileCanvas, tileContext, containerPoint, onComplete);
  }

  getMap() {
    return super.getMap();
  }
}

class VectorTileCanvasRenderer extends CanvasTileLayerCanvasRenderer {
  loadTile(tile: any) {
    // @ts-ignore
    // tslint:disable-next-line:no-this-assignment
    const { layer, canvas } = this;
    const tileSize = layer.getTileSize();
    const canvasClass = canvas.constructor;
    const map = this.getMap();
    // tslint:disable-next-line:no-this-assignment
    const that = this;
    const r = map.getDevicePixelRatio();
    const tileCanvas = Canvas2D.createCanvas(tileSize.width * r, tileSize.height * r, canvasClass);
    tileCanvas.layer = layer;
    const extent = new Extent(
      map.pointToCoordinate(tile.point),
      map.pointToCoordinate(tile.point.add(tileSize.toPoint())),
      map.getProjection(),
    );
    layer.drawTile(tileCanvas, {
      extent,
      url: tile.url,
      point: tile.point,
      center: map.pointToCoordinate(tile.point.add(tileSize.width / 2, tileSize.height / 2)),
      z: tile.z,
      x: tile.x,
      y: tile.y,
    }, (error: any) => {
      if (error) {
        // @ts-ignore
        that.onTileError(tileCanvas, tile);
        return;
      }
      // @ts-ignore
      that.onTileLoad(tileCanvas, tile);
    });
    return tileCanvas;
  }

  getMap() {
    return super.getMap();
  }
}

class VectorTileGlRenderer extends CanvasTileLayerGLRenderer {
  loadTile(tile: any) {
    // @ts-ignore
    // tslint:disable-next-line:no-this-assignment
    const { layer, canvas, onTileError, onTileLoad } = this;
    const tileSize = layer.getTileSize();
    const canvasClass = canvas.constructor;
    // tslint:disable-next-line:no-this-assignment
    const that = this;
    const map = this.getMap();
    const r = map.getDevicePixelRatio();
    const tileCanvas = Canvas2D.createCanvas(tileSize.width * r, tileSize.height * r, canvasClass);
    tileCanvas.layer = layer;
    const extent = new Extent(
      map.pointToCoordinate(tile.point),
      map.pointToCoordinate(tile.point.add(tileSize.toPoint())),
      map.getProjection(),
    );
    layer.drawTile(tileCanvas, {
      extent,
      url: tile.url,
      point: tile.point,
      center: map.pointToCoordinate(tile.point.add(tileSize.width / 2, tileSize.height / 2)),
      z: tile.z,
      x: tile.x,
      y: tile.y,
    }, (error: any) => {
      if (error) {
        // @ts-ignore
        that.onTileError(tileCanvas, tile);
        return;
      }
      // @ts-ignore
      that.onTileLoad(tileCanvas, tile);
    });
    return tileCanvas;
  }

  getMap() {
    return super.getMap();
  }
}

// @ts-ignore
VectorTile.registerRenderer('canvas', VectorTileCanvasRenderer);
// @ts-ignore
VectorTile.registerRenderer('gl', VectorTileGlRenderer);

export default VectorTile;
