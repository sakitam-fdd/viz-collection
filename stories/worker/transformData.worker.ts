// @ts-ignore
import * as GeoTIFF from 'geotiff/dist/geotiff.bundle.min.js';
import { getGridPoints } from '../utils/common';

const ctx: Worker = self as any;

ctx.addEventListener('message', async ({ data: payload }) => {
  const { action, url } = payload;
  if (action === 'getData') {
    const arrayBuffer = await fetch(url, {
      method: 'GET',
    })
      .then((response) => {
        return response.arrayBuffer();
      });
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
    ctx.postMessage(res);
  }
});
