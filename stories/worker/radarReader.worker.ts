import KDBush from 'kdbush';
import geokdbush from 'geokdbush';
import proj4 from 'proj4';
import { getImageDataWithParams } from '../utils/common';

const ctx: Worker = self as any;

const extent = [66.68402763165123, 12.77002268658371, 143.5424729859214, 56.38334307775602];

function transformExtent(extent: number[], source: string, destination: string) {
  const a = proj4(source, destination, [extent[0], extent[1]]);
  console.log(a);
  return [
    ...proj4(source, destination, [extent[0], extent[1]]),
    ...proj4(source, destination, [extent[2], extent[3]]),
  ];
}

function toLonLat(coordinates: number[]): number[] {
  return proj4('EPSG:3857', 'EPSG:4326', coordinates);
}

const mercatorExtent: any[] = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

interface PointData {
  coordinates: number[];
  itemData: Uint8ClampedArray;
}

const indexData: {
  [key: string]: any;
} = {};

ctx.addEventListener('message', async ({ data: payload }) => {
  if (payload[0] === 'decodeData' && payload[1]) {
    const imageData = payload[2];
    // @ts-ignore
    const { width, height } = imageData;
    const dx = (mercatorExtent[2] - mercatorExtent[0]) / width;
    const dy = (mercatorExtent[3] - mercatorExtent[1]) / height;
    const points: PointData[] = [];
    console.time('start');
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const itemData: Uint8ClampedArray = getImageDataWithParams(imageData, x, y, 1, 1);
        const coordinates = toLonLat([
          mercatorExtent[0] + dx * x,
          mercatorExtent[1] + dy * y,
        ]);
        points.push({
          coordinates,
          itemData,
        });
      }
    }

    console.timeEnd('start');

    console.log(points);

    const index = new KDBush(points, (p: PointData) => p.coordinates[0], (p: PointData) => p.coordinates[1]);
    indexData[payload[1]] = index;

    console.log(indexData);
    ctx.postMessage({
      type: payload[0],
      status: 'success',
    });
  } else if (payload[0] === 'queryData' && payload[1] && payload[2]) { // type, id, position
    const lon: number = payload[2].lon;
    const lat: number = payload[2].lat;
    const maxResults = payload[2].maxResults || 1;
    const nearest = geokdbush.around(indexData[payload[1]], lon, lat, maxResults);

    ctx.postMessage({
      type: payload[0],
      data: nearest,
      status: 'success',
    });
  }
});
