import throttle from 'lodash/throttle';
import React, {
  useRef,
  useState,
  useEffect,
} from 'react';

import './index.less';
import { initThree, resizeRenderer } from './ThreeOffscreen.render';
import { getDevicePixelRatio } from '../../utils/common';
// @ts-ignore
import ThreeWorker from '../../worker/threeOffscreen.worker';

let worker: Worker;

// tslint:disable-next-line:function-name
function ThreeOffscreen() {
  const canvas1Ref: React.MutableRefObject<HTMLCanvasElement | null> = useRef(null);
  const canvas2Ref: React.MutableRefObject<HTMLCanvasElement | null> = useRef(null);

  const [inited, setInit] = useState(false);
  const pixelRatio = getDevicePixelRatio();

  const onresize = throttle(() => {
    if (canvas1Ref && canvas1Ref.current) {
      const { clientWidth, clientHeight } = canvas1Ref.current;
      resizeRenderer(clientWidth, clientHeight, true);
    }

    if (canvas2Ref && canvas2Ref.current) {
      const { clientWidth, clientHeight } = canvas2Ref.current;
      worker && worker.postMessage({
        actionType: 'resize',
        width: clientWidth,
        height: clientHeight,
      });
    }
  }, 100);

  useEffect(() => {
    window.addEventListener('resize', onresize);
    if (!inited && canvas1Ref && canvas1Ref.current && canvas2Ref && canvas2Ref.current) {
      const { clientWidth, clientHeight } = canvas1Ref.current;

      initThree(
        canvas1Ref.current,
        clientWidth,
        clientHeight,
        pixelRatio,
        'textures/matcap-porcelain-white.jpg',
        './',
      );

      if ('transferControlToOffscreen' in canvas2Ref.current) {
        const offscreen = canvas2Ref.current.transferControlToOffscreen();
        worker = new ThreeWorker();
        worker.postMessage({
          pixelRatio,
          actionType: 'init',
          canvas: offscreen,
          width: canvas2Ref.current.clientWidth,
          height: canvas2Ref.current.clientHeight,
          basePath: '',
          texturePath: '/textures/matcap-porcelain-white.jpg',
          // @ts-ignore
        }, [offscreen]);
      }
      setInit(true);
    }

    return () => {
      if (worker) {
        worker.terminate();
      }
      window.removeEventListener('resize', onresize);
    };
  }, []);

  return (<div className="map-warp">
    <canvas ref={canvas1Ref} className="canvas-container" />
    <canvas ref={canvas2Ref} className="canvas-container" />
  </div>);
}

export default ThreeOffscreen;
