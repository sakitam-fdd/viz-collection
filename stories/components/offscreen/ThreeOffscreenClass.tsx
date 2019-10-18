import throttle from 'lodash/throttle';
import React from 'react';

import './index.less';
import { initThree, resizeRenderer } from './ThreeOffscreen.render';
import { getDevicePixelRatio } from '../../utils/common';
// @ts-ignore
import ThreeWorker from '../../worker/threeOffscreen.worker';

export interface PageProps {}

export interface PageState {}

class ThreeOffscreen extends React.Component<PageProps, PageState> {
  private worker: Worker | undefined;

  private canvas1Ref: React.RefObject<HTMLCanvasElement>;
  private canvas2Ref: React.RefObject<HTMLCanvasElement>;

  constructor(props: PageProps, context: any) {
    super(props, context);

    this.canvas1Ref = React.createRef();
    this.canvas2Ref = React.createRef();

    this.onMessage = this.onMessage.bind(this);
    this.onresize = throttle(this.onresize.bind(this), 100);
  }

  onMessage({ data: payload }: any) {
    console.log(payload);
  }

  onresize() {
    if (this.canvas1Ref && this.canvas1Ref.current) {
      const { clientWidth, clientHeight } = this.canvas1Ref.current;
      resizeRenderer(clientWidth, clientHeight, true);
    }

    if (this.canvas2Ref && this.canvas2Ref.current) {
      const { clientWidth, clientHeight } = this.canvas2Ref.current;
      this.worker && this.worker.postMessage({
        actionType: 'resize',
        width: clientWidth,
        height: clientHeight,
      });
    }
  }

  componentDidMount() {
    const pixelRatio = getDevicePixelRatio();
    if (this.canvas1Ref && this.canvas1Ref.current && this.canvas2Ref && this.canvas2Ref.current) {
      const { clientWidth, clientHeight } = this.canvas1Ref.current;
      initThree(
        this.canvas1Ref.current,
        clientWidth,
        clientHeight,
        pixelRatio,
        'textures/matcap-porcelain-white.jpg',
        './',
      );

      if ('transferControlToOffscreen' in this.canvas2Ref.current) {
        const offscreen = this.canvas2Ref.current.transferControlToOffscreen();
        this.worker = new ThreeWorker();

        if (this.worker) {
          this.worker.addEventListener('message', this.onMessage);
          this.worker.postMessage({
            pixelRatio,
            actionType: 'init',
            canvas: offscreen,
            width: this.canvas2Ref.current.clientWidth,
            height: this.canvas2Ref.current.clientHeight,
            // basePath: '',
            texturePath: '/textures/matcap-porcelain-white.jpg',
            // @ts-ignore
          }, [offscreen]);
        }
      }

      window.addEventListener('resize', this.onresize);
    }
  }

  componentWillUnmount(): void {
    if (this.worker) {
      this.worker.terminate();
    }
    window.removeEventListener('resize', this.onresize);
  }

  render() {
    return (<div className="map-warp">
      <canvas ref={this.canvas1Ref} className="canvas-container" />
      <canvas ref={this.canvas2Ref} className="canvas-container" />
    </div>);
  }
}

export default ThreeOffscreen;
