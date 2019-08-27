// @ts-ignore
import * as GeoTIFF from 'geotiff/dist/geotiff.bundle.min.js';
import { getGridPoints } from '../utils/common';
import { ajax } from '../utils/ajax';

const ctx: Worker = self as any;

ctx.addEventListener('message', async ({ data: payload }) => {
  const { action, url } = payload;
  if (action === 'getData') {
    console.log(url);
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
      data: res,
      status: 'success',
    });
  }
});
