const ctx: Worker = self as any;

function createCanvas(mode: string, size: {
  width: number;
  height: number;
}) {
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (mode === 'transfer') {
    canvas = new OffscreenCanvas(size.width, size.height);
  }
  // @ts-ignore
  return canvas;
}
