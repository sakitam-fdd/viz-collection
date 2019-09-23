// @ts-ignore
import GeoJSONVt from 'geojson-vt';
import { replacer } from '../utils/common';

const ctx = self as any;

const slicers = {};
let options;

ctx.addEventListener('message', ({ data: payload }: any) => {
  if (payload[0] === 'slice') {
    const geojson = payload[1];
    options = payload[2] || {};

    slicers[options.layerName] = GeoJSONVt(geojson, options);

    ctx.postMessage({
      type: 'slice',
    });
  } else if (payload[0] === 'get') {
    const coords = payload[1];

    const tileLayers = {};
    Object.keys(slicers).forEach((layerName: string | number) => {
      const slicedTileLayer = slicers[layerName].getTile(coords.z, coords.x, coords.y);
      console.log(slicedTileLayer, coords);
      const featureString = JSON.stringify({
        type: 'FeatureCollection',
        features: slicedTileLayer ? slicedTileLayer.features : [],
      }, replacer);

      const collection = JSON.parse(featureString);

      if (slicedTileLayer) {
        const vectorTileLayer = {
          layerName,
          features: collection.features,
          extent: slicedTileLayer.extent,
          length: slicedTileLayer.features.length,
        };

        tileLayers[layerName] = vectorTileLayer;
      }
    });
    ctx.postMessage({
      coords,
      layers: tileLayers,
    });
  }
});
