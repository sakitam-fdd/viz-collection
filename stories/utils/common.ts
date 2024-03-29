// @ts-ignore
import proj4 from 'proj4';
// @ts-ignore
import * as GeoTIFF from 'geotiff/dist/geotiff.bundle.min.js';
// @ts-ignore
import { contours } from 'd3-contour';
// import { readRasterFromURL } from 'fast-geotiff';
// @ts-ignore
import * as getPixels from 'get-pixels';
import isString from 'lodash/isString';

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

const originConfig = {
  ...lastConfig,
  ...config,
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
  // return (Number(val) + 50) / (35 + 50);
  return Number(val);
});

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
          color: `rgb(${originConfig[String(item.value)].join(',')})`,
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
        const ringsNum: number[][] = [];
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

// export function getData(url: string) {
//   return new Promise((resolve) => {
//     (async function () {
//       const data = await readRasterFromURL(url);
//       console.time('start');
//       console.log(data);
//       const imgData = [];
//       for (let i = 0, len = data[0].length; i < len; i++) {
//         imgData.push(data[0][i] - 273.15);
//       }
//       const res = getGridPoints({
//         data: data[0],
//         width: data.width,
//         height: data.height,
//       });
//       // initMap(res);
//       console.timeEnd('start');
//       resolve(res);
//     })();
//   });
// }

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

/**
 * check array has data
 * @param obj
 */
function isArrayHasData(obj: any) {
  return Array.isArray(obj) && obj.length > 0;
}

/**
 * read image data
 * @param url
 */
function readImage(url: string) {
  return new Promise(((resolve, reject) => {
    getPixels(url, (err: any, pixels: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(pixels);
    });
  }));
}

/**
 * get image pixel data
 * @param image
 */
function getImageData(image: HTMLImageElement | string) {
  return new Promise(((resolve: any, reject: any) => {
    if (isString(image)) {
      readImage(image).then(resolve).catch(reject);
    } else {
      const { width, height } = image;
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      // @ts-ignore
      context.drawImage(image, 0, 0, width, height);
      // @ts-ignore
      const imageData = context.getImageData(0, 0, width, height);
      resolve(imageData);
    }
  }));
}

export function getImageDataWithParams(
  imageData: ImageData, minX: number, minY: number, width: number, height: number,
): Uint8ClampedArray {
  const maxX = minX + width;
  const maxY = minY + height;

  const data = new Uint8ClampedArray(width * height * 4);
  let dataIndex = 0;

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const index = (y * maxX + x) * 4;

      data[dataIndex++] = imageData.data[index];
      data[dataIndex++] = imageData.data[index + 1];
      data[dataIndex++] = imageData.data[index + 2];
      data[dataIndex++] = Math.round(imageData.data[index + 3] * 255);
    }
  }

  return data;
}

/**
 * 获取设备缩放比
 */
export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

/**
 * load image
 * @param src
 */
export function loadImage(src: string) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = reject;
    image.src = src;
  });
}

export {
  values,
  colors,
  replacer,
  readImage,
  getImageData,
  isArrayHasData,
};
