## 给定一张雷达灰度图从中读取每一点的值的前端实现方案

### 通过渲染后的 canvas 或者 webgl 拾取

此种方案要求所要操作的灰度图必须在浏览器内正确渲染，且所在的画布不能有透明度的改变

```js
var map = new maptalks.Map('map', {
    center: [113.95449050367006, 37.76498196951863],
    zoom: 4,
  });

  const renderer = 'canvas';

  var imageLayer = new maptalks.ImageLayer('images',
    [
      {
        url: './data/201907021018_042.png',
        extent: [66.68402763165123, 12.77002268658371, 143.5424729859214, 56.38334307775602],
        opacity: 1
      },
    ], {
      zIndex: -1,
      renderer: renderer,
      // opacity: 0
    });

  map.addLayer(imageLayer);

  new maptalks.TileLayer('base', {
    urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  var diff = new maptalks.ImageLayer('1',
    [
      {
        url: './data/201907021018_042_color.png',
        extent: [66.68402763165123, 12.77002268658371, 143.5424729859214, 56.38334307775602],
        opacity: 1
      },
    ], {
      renderer: renderer,
      // opacity: 0
    });
  map.addLayer(diff);

  let id = 0;

  let ctx = null;
  map.on('mousemove', event => {
    if (renderer === 'canvas') {
      if (!ctx) {
        ctx = imageLayer.getRenderer().context;
      }
      console.time(id.toString());
      const pixel = event.containerPoint;
      const data = ctx.getImageData(pixel.x, pixel.y, 1, 1);
      console.timeEnd(id.toString());
      console.log(data.data);
    } else {
      if (!ctx) {
        ctx = imageLayer.getRenderer().gl;
      }
      console.time(id.toString());
      const pixel = event.containerPoint;
      // https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/pixelStorei
      ctx.pixelStorei(ctx.PACK_ALIGNMENT || 0x0D05, 4);

      // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
      const pixels = new Uint8Array(4);
      ctx.readPixels(pixel.x, pixel.y, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);
      console.timeEnd(id.toString());
      console.log(pixels);
    }
    id++;
  });
```

### 原图读取

通过计算鼠标位置对应的墨卡托位置`p`（为什么使用墨卡托：是因为墨卡托网格为线性的，经纬度在`EPSG:4326` 投影下经纬度变化时非线性的，所以需要对经纬度进行变换）
而雷达灰度图我们已知它的墨卡托范围`extent`和图像宽高`w 、 h`，那么根据以下公式就可以计算出鼠标当前位置对应的原图的像素位置：

```js
const { x, y } = p;
const { xmin, ymin, xmax, ymax } = extent;

const current = {
  x: (xmax - xmin) / w * (x - xmin),
  y: (ymax - ymin) / h * (y - ymin),
}
```

 然后根据计算出的落点去图像中查找对应位置的像素：
 
 ```js
const { x, y } = current;
const rgba = getImageData([
  x / (xmax - xmin) * w,
  y / (ymax - ymin) * h,
], 1, 1);
```

### 将原图数据转换为经纬度数据集，然后利用空间索引实时查找

详细代码见 `radarReader.worker`
