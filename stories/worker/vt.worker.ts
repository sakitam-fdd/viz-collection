// @ts-ignore
import geojsonvt from 'geojson-vt';
// @ts-ignore
import * as GeoTIFF from 'geotiff/dist/geotiff.bundle.min.js';
import { getGridPoints } from '../utils/common';
import { ajax } from '../utils/ajax';

const ctx: Worker = self as any;
let tileIndex: geojsonvt;

const replacer = function (_key: string, value: any) {
  if (value.geometry) {
    let type;
    const rawType = value.type;
    let geometry = value.geometry;

    if (rawType === 1) {
      type = 'MultiPoint';
      if (geometry.length === 1) {
        type = 'Point';
        geometry = geometry[0];
      }
    } else if (rawType === 2) {
      type = 'MultiLineString';
      if (geometry.length === 1) {
        type = 'LineString';
        geometry = geometry[0];
      }
    } else if (rawType === 3) {
      type = 'Polygon';
      if (geometry.length > 1) {
        type = 'MultiPolygon';
        geometry = [geometry];
      }
    }

    return {
      type: 'Feature',
      geometry: {
        type,
        coordinates: geometry,
      },
      properties: value.tags,
    };
  }
  return value;
};

ctx.addEventListener('message', async ({ data: payload }) => {
  const { action, url } = payload;
  if (action === 'getData') {
    const data =  await ajax(url, {
      methods: 'get',
      responseType: 'arraybuffer',
    });

    const tiff = await GeoTIFF.fromArrayBuffer(data);
    const image = await tiff.getImage();
    const imageData = await image.readRasters(); // 273.15
    console.time('start');
    // const imgData = [];
    // for (let i = 0, len = data[0].length; i < len; i++) {
    //   imgData.push(data[0][i] - 273.15);
    // }
    // const $data = new Float32Array(imgData);
    const res = getGridPoints({
      data: imageData[0],
      width: image.getWidth(),
      height: image.getHeight(),
    });
    // initMap(res);
    console.timeEnd('start');
    ctx.postMessage({
      type: action,
      data: res,
      status: 'success',
    });
  } else if (action === 'create-vt') {
    tileIndex = geojsonvt(payload.data, {
      extent: 4096,
      debug: 1,
    });
    ctx.postMessage({
      type: action,
      status: 'success',
    });
  } else if (action === 'getTile') {
    const tile = payload.tile;
    const tilePixels = payload.tilePixels;
    const format = tile.getFormat();
    const tileCoord = tile.getTileCoord();
    const data = tileIndex.getTile(tileCoord[0], tileCoord[1], -tileCoord[2] - 1);
    const featureString = JSON.stringify({
      type: 'FeatureCollection',
      features: data ? data.features : [],
    }, replacer);
    ctx.postMessage({
      type: action,
      data: featureString,
      status: 'success',
    });
    const features = format.readFeatures(featureString);
    tile.setLoader(() => {
      tile.setFeatures(features);
      tile.setProjection(tilePixels);
    });
  }
});
