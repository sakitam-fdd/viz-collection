import {
  initThree, resizeRenderer,
} from '../components/offscreen/ThreeOffscreen.render';

const ctx: Worker = self as any;

ctx.addEventListener('message', async ({ data: payload }) => {
  const { actionType, drawingSurface, width, height, pixelRatio, path } = payload;

  if (actionType === 'init') {
    initThree(drawingSurface, width, height, pixelRatio, path);
  } else if (actionType === 'resize') {
    resizeRenderer(width, height);
  }
});
