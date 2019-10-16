// @ts-ignore
import * as GeoTIFF from 'geotiff/dist/geotiff.bundle.min.js';
import { ajax } from '../stories/utils/ajax';

const ctx: Worker = self as any;

ctx.addEventListener('message', async ({ data: payload }) => {
  const datas = [];

  if (Array.isArray(payload)) {
    for (let i = 0, len = payload.length; i < len; i++) {
      const data = await ajax(payload[i], {
        methods: 'get',
        responseType: 'arraybuffer',
      });

      const tiff = await GeoTIFF.fromArrayBuffer(data);
      const image = await tiff.getImage();
      const imageData = await image.readRasters();

      datas.push({
        data: imageData[0],
        width: image.getWidth(),
        height: image.getHeight(),
      });
    }
  }

  ctx.postMessage({
    data: datas,
    status: 'success',
  });
});
