// @ts-ignore
import proj4 from 'proj4';
// @ts-ignore
import * as GeoTIFF from 'geotiff/dist/geotiff.bundle.min.js';
// @ts-ignore
import { contours } from 'd3-contour';

const lastConfig = {
  '-50': [0, 0, 255],
  '-30': [0, 20, 255],
  '-28': [0, 68, 255],
  '-26': [0, 102, 255],
  '-24': [0, 132, 255],
  '-22': [0, 166, 255],
  '-20': [0, 200, 255],
  '-18': [0, 234, 255],
  '-16': [0, 255, 247],
  '-14': [0, 255, 212],
  '-12': [0, 255, 179],
  '-10': [0, 255, 144],
  '-8': [0, 255, 115],
  '-6': [0, 255, 81],
  '-4': [0, 255, 47],
  '-2': [0, 255, 13],
};

const config = {
  0: [17, 255, 0],
  2: [51, 255, 0],
  4: [85, 255, 0],
  6: [119, 255, 0],
  8: [149, 255, 0],
  10: [183, 255, 0],
  12: [217, 255, 0],
  14: [251, 255, 0],
  16: [255, 229, 0],
  18: [255, 195, 0],
  20: [255, 162, 0],
  22: [255, 128, 0],
  24: [255, 98, 0],
  26: [255, 64, 0],
  28: [255, 45, 0],
  30: [255, 35, 0],
  32: [255, 20, 0],
  35: [255, 0, 0],
};

let values: any = [];
const colors: string[] = [];
// const extent = [70, 15, 140, 60];
const mercatorExtent = [
  -20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244,
];
// const mercatorExtent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');

Object.keys(lastConfig).forEach((key: number | string) => {
  values.push(key);
  colors.push(`rgb(${lastConfig[key].join(',')})`);
});

Object.keys(config).forEach((key: number | string) => {
  values.push(key);
  colors.push(`rgb(${config[key].join(',')})`);
});

values = values.map((val: number | string) => {
  console.log(val);
  // return (Number(val) + 50) / (35 + 50);
  return Number(val);
});

export function transformExtent(extent: number[], source: string, destination: string): number[] {
  return [
    ...proj4(source, destination, [extent[0], extent[1]]),
    ...proj4(source, destination, [extent[2], extent[3]]),
  ];
}

export function getGridPoints(data: any) {
  const { width, height } = data;
  const size = {
    width, height,
  };

  // Compute the contour polygons at log-spaced intervals; returns an array of MultiPolygon.
  const polygons = contours()
    .size([width, height])
    .thresholds(values)(data.data);

  const features: any = {
    type: 'FeatureCollection',
    features: [],
  };

  let i = 0;
  const length = polygons.length;
  for (; i < length; i++) {
    const item = polygons[i];
    if (item && item.coordinates.length > 0) {
      const coordinates = mathCoordinates(item.coordinates, size, mercatorExtent, false);
      features.features.push({
        type: 'Feature',
        properties: {
          value: item.value,
        },
        geometry: {
          coordinates,
          type: item.type,
        },
      });
    }
  }

  return features;
}

export function mathCoordinates(data: any, size: {
  width: number;
  height: number;
  // @ts-ignore
},                              extent: number[], simple?: boolean) {
  const res = [];
  let i = 0;
  const { width, height } = size;
  const length = data.length;
  for (; i < length; i++) {
    let j = 0;
    const item = data[i];
    const projCoords = [];
    for (; j < item.length; j++) {
      const rings = item[j];
      if (rings.length >= 4) {
        let k = 0;
        const ringsNum: number[] = [];
        // if (simple) { // 对坐标进行抽稀
        //   rings = simplify(rings, get(samplifyOpt, 'tolerance', 1), get(samplifyOpt, 'highQuality', false));
        // }
        for (; k < rings.length; k++) {
          const point = proj4('EPSG:3857', 'EPSG:4326', [
            extent[0] + (extent[2] - extent[0]) * (rings[k][0] / width),
            extent[3] - (extent[3] - extent[1]) * (rings[k][1] / height),
          ]);
          // const point = [
          //   extent[0] + (extent[2] - extent[0]) * (rings[k][0] / width),
          //   extent[3] - (extent[3] - extent[1]) * (rings[k][1] / height),
          // ];
          ringsNum.push(point);
        }
        projCoords.push(ringsNum);
      }
    }
    res.push(projCoords);
  }
  return res;
}

export function getData(url: string = './201908252200.tif') {
  // tslint:disable-next-line:ter-arrow-parens
  return new Promise(resolve => {
    fetch(url, {
      // fetch('./2019082320.tiff', {
      method: 'GET',
    })
      .then((response) => {
        return response.arrayBuffer();
      })
      .then((arrayBuffer: ArrayBuffer) => {
        (async function () {
          const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
          const image = await tiff.getImage();
          const data = await image.readRasters(); // 273.15
          console.time('start');
          // const imgData = [];
          // for (let i = 0, len = data[0].length; i < len; i++) {
          //   imgData.push(data[0][i] - 273.15);
          // }
          // const $data = new Float32Array(imgData);
          const res = getGridPoints({
            data: data[0],
            width: image.getWidth(),
            height: image.getHeight(),
          });
          // initMap(res);
          console.timeEnd('start');
          resolve(res);
        })();
      });
  });
}

export {
  values,
  colors,
};
