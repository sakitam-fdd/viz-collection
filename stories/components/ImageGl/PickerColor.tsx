import '../../styles/picker.less';
import * as React from 'react';
import REGL from 'regl';
import {
  getDevicePixelRatio, loadImage,
  createContext,
} from '../../utils/viz';

export interface PageProps {}

export interface PageState {}

class PickerColor extends React.Component<PageProps, PageState> {
  private $el: React.RefObject<HTMLElement>;
  private canvas1: React.RefObject<HTMLCanvasElement>;
  private canvas2: React.RefObject<HTMLCanvasElement>;
  private style: { width: string; height: string };
  event: CustomEvent<unknown>;
  private ctx: CanvasRenderingContext2D | null;
  private gl: WebGLRenderingContext | null;
  constructor(props: PageProps, context: any) {
    super(props, context);

    this.$el = React.createRef();

    this.canvas1 = React.createRef();
    this.canvas2 = React.createRef();

    this.style = {
      height: '100vh',
      width: '100vw',
    };

    this.event = new CustomEvent('logger', {});

    if (this.$el.current) {
      this.$el.current.dispatchEvent(this.event);
    }

    this.ctx = null;

    this.onresize = this.onresize.bind(this);
  }

  onresize() {
    const scaleFactor = getDevicePixelRatio();
    if (this.ctx) {
      if (!this.canvas1.current) return;
      this.canvas1.current.width = this.canvas1.current.clientWidth * scaleFactor;
      this.canvas1.current.height = this.canvas1.current.clientHeight * scaleFactor;
    }

    if (!this.canvas2.current) return;
    this.canvas2.current.width = this.canvas2.current.clientWidth * scaleFactor;
    this.canvas2.current.height = this.canvas2.current.clientHeight * scaleFactor;

    if (this.gl) {
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }
  }

  initCanvas() {
    if (this.canvas1.current) {
      this.ctx = this.canvas1.current.getContext('2d');
      this.onresize();
      if (this.ctx) {
        loadImage('./data/201909061506.png').then((res: any) => {
          console.log(res);
          // @ts-ignore
          const { width, height } = this.canvas1.current;
          console.time('draw');
          // @ts-ignore
          this.ctx.drawImage(res, 0, 0, res.width, res.height, 0, 0, width, height);
          console.timeEnd('draw');

          console.time('image-loop');
          const imageData = this.ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          for (let i = 0, len = data.length; i < len; i += 4) {
            data[i] *= 255;
            data[i + 1] *= 255;
            data[i + 2] *= 255;
          }
          console.timeEnd('image-loop');

          console.time('render');
          this.ctx.putImageData(imageData, 0, 0);
          console.timeEnd('render');
        });
      }
    }
  }

  handleCanvasClick(event: MouseEvent) {
    const { clientX, clientY } = event;
    const imageData = this.ctx.getImageData(clientX, clientY, 1, 1);
    const data = imageData.data;
    console.log(data);
  }

  handleCanvasMouseMove(event: MouseEvent) {
    const { clientX, clientY } = event;
    const imageData = this.ctx.getImageData(clientX, clientY, 1, 1);
    const data = imageData.data;
    console.log(data);
  }

  initGl() {
    if (this.canvas2.current) {
      this.onresize();
      this.gl = createContext(this.canvas2.current, {
        antialias: false,
        depth: false,
        stencil: false,
        alpha: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
      });

      loadImage('./data/201909061506.png').then((image: any) => {
        // @ts-ignore
        const { width, height } = this.canvas2.current;

        const regl = REGL({
          gl: this.gl,
        });

        const imageTexture = regl.texture(image);

        interface Uniforms {
          texture: REGL.Texture2D;
        }

        interface Attributes {
          position: number[];
        }

        // const x1 = 0;
        // const x2 = x1 + width;
        // const y1 = 0;
        // const y2 = y1 + height;

        regl<Uniforms, Attributes>({
          frag: require('../../shaders/imagePicker.fragment.glsl').default,

          vert: require('../../shaders/imagePicker.vertex.glsl').default,

          attributes: {
            position: [
              0, 1,
              1, 0,
              1, 1,
            ],
          },

          uniforms: {
            texture: imageTexture,
            u_resolution: [width, height],
          },

          count: 3,
        })();
      });
    }
  }

  componentDidMount() {
    if (this.canvas1) {
      this.initCanvas();
    }

    if (this.canvas2) {
      this.initGl();
    }

    console.log(this);

    window.addEventListener('resize', this.onresize);

    // this.dispatchEvent(this.event, {});
  }

  componentWillReceiveProps() {}

  render() {
    // const { children } = this.props;
    // @ts-ignore
    return (<div ref={this.$el} className="view-content" style={this.style}>
      <canvas
        ref={this.canvas1}
        className="view-content__left"
        onClick={((event1: MouseEvent<HTMLCanvasElement, MouseEvent>) => this.handleCanvasClick(event1))}
        onMouseMove={((event1: MouseEvent<HTMLCanvasElement, MouseEvent>) => this.handleCanvasMouseMove(event1))}
      />
      <canvas ref={this.canvas2} className="view-content__right" />
    </div>);
  }
}

export default PickerColor;
