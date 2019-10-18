import {
  initThree, resizeRenderer,
} from '../components/offscreen/ThreeOffscreen.render';

const ctx: Worker = self as any;

ctx.addEventListener('message', async ({ data: payload }) => {
  const { actionType, canvas, width, height, pixelRatio, texturePath, basePath } = payload;
  if (actionType === 'init') {
    initThree(canvas, width, height, pixelRatio, texturePath, `${basePath ? basePath : location.origin}`);
  } else if (actionType === 'resize') {
    resizeRenderer(width, height, false);
  }
});
