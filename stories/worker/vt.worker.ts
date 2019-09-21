// @ts-ignore
import get from 'lodash-es/get';
// @ts-ignore
import geojsonvt from 'geojson-vt';
// @ts-ignore
import * as GeoTIFF from 'geotiff/dist/geotiff.bundle.min.js';
import { getGridPoints, replacer } from '../utils/common';
import { ajax } from '../utils/ajax';

const ctx: Worker = self as any;
let tileIndex: geojsonvt;

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
      data: tileIndex,
      status: 'success',
    });
  } else if (action === 'getTile') {
    const tile = payload.tile;
    const tileCoord = tile.getTileCoord();
    const data = tileIndex.getTile(tileCoord[0], tileCoord[1], -tileCoord[2] - 1);
    const featureString = JSON.stringify({
      type: 'FeatureCollection',
      features: data ? data.features : [],
    }, replacer);
    ctx.postMessage({
      tile,
      type: action,
      data: featureString,
      status: 'success',
    });
  } else if (action === 'GeoJSON') {
    const res =  await ajax(url, {
      methods: 'get',
      responseType: 'json',
    });

    const data: any[] = res.data;

    const features: any = {
      type: 'FeatureCollection',
      features: [],
    };
    console.time('start');

    for (let i = 0, len = data.length; i < len; i++) {
      const item = data[i] || {};
      if (item.geom && item.geom.indexOf('coordinates') > -1) {
        const geom = JSON.parse(item.geom);
        const area = get(item, 'area', {});
        const feature: any = {
          type: 'Feature',
          properties: {
            id: item.id,
            name: item.name,
            pId: item.pId,
          },
          geometry: {
            // type: geom.geometry.type,
            // coordinates: geom.geometry.coordinates,
            type: geom.type,
            coordinates: geom.coordinates,
          },
        };
        // FIXME: 将作物 id 和对应颜色对应到属性中
        Object.keys(area).map((key: string | number) => {
          const color = get(area, `${key}.color`, '[255, 255, 255, 0]');
          const parseColor = JSON.parse(color) || [255, 255, 255, 0];
          feature.properties[key] = `rgba(${parseColor.join(',')})`;
        });
        features.features.push(feature);
      }
    }

    console.timeEnd('start');

    ctx.postMessage({
      type: action,
      data: features,
      status: 'success',
    });
  }
});
