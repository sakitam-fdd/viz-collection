const CONTEXT_TYPES = [
  'experimental-webgl',
  'webgl',
  'webkit-3d',
  'moz-webgl',
];

export function createCanvas(width: number, height: number, scaleFactor: number, Canvas: any): HTMLCanvasElement {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    return canvas;
  }
  // create a new canvas instance in node.js
  // the canvas class needs to have a default constructor without any parameter
  return new Canvas(width, height);
}

/**
 * 创建图形绘制上下文
 * @param canvas
 * @param glOptions
 * @returns {*}
 */
export function createContext(canvas: HTMLCanvasElement, glOptions = {}): WebGLRenderingContext | null {
  if (!canvas) {
    return null;
  }
  const ii = CONTEXT_TYPES.length;
  for (let i = 0; i < ii; ++i) {
    try {
      const context = canvas.getContext(CONTEXT_TYPES[i], glOptions);
      if (context) {
        // @ts-ignore
        return context;
      }
    } catch (e) {
      console.log(e);
    }
  }
  return null;
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
