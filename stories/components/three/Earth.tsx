import '../../styles/picker.less';
import * as React from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from '../../plugins/OrbitControls';
// import OrbitControls from 'three-orbitcontrols';
import {
  createContext,
} from '../../utils/viz';

export interface PageProps {}

export interface PageState {}

console.log(OrbitControls);

class ThreeEarth {
  mesh: THREE.Mesh;
  radius: number;
  center: {
    x: number;
    y: number;
    z: number;
  };
  constructor(options: {
    radius: number;
    center?: {
      x: number;
      y: number;
      z: number;
    };
  } = {
    radius: 300,
    center: {
      x: 0, y: 0, z: 0,
    },
  }) {
    this.radius = undefined;
    this.mesh = null;
    this.radius = options.radius;
    this.center = options.center;
    this.init();
  }

  init() {
    const Texture = (new THREE.TextureLoader()).load('./image/earth.png');
    const sphere = new THREE.SphereGeometry(489.6, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      map: Texture,
      shininess: 100,
      bumpScale: 1,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(0, 0, 0);
    mesh.rotateY(-.5 * Math.PI);
    this.mesh = mesh;
  }

  updateRadius(radius: number) {
    this.radius = radius;
    const sphere = new THREE.SphereGeometry(radius, 64, 64);
    this.mesh.geometry = sphere;
  }
}

class MessageBox {
  constructor(options: {
    radius: number;
    center?: {
      x: number;
      y: number;
      z: number;
    };
  } = {
    radius: 300,
    center: {
      x: 0, y: 0, z: 0,
    },
  }) {}

  init() {
  }

  animate() {

  }

  updateRadius() {

  }
}

class Earth extends React.Component<PageProps, PageState> {
  private $el: React.RefObject<HTMLElement>;
  private canvas: React.RefObject<HTMLCanvasElement>;
  private style: { width: string; height: string };
  event: CustomEvent<unknown>;
  private ctx: CanvasRenderingContext2D | null;
  private gl: WebGLRenderingContext | null;
  private mesh: THREE.Mesh;
  private camera: THREE.Scence;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private group: THREE.Group;
  private hasMove: boolean;
  private width: Number;
  private height: Number;
  earth: ThreeEarth;
  messageBox: MessageBox;
  controls: any;
  counter: number;

  constructor(props: PageProps, context: any) {
    super(props, context);

    this.$el = React.createRef();

    this.canvas = React.createRef();

    this.style = {
      height: '100vh',
      width: '100vw',
    };

    this.event = new CustomEvent('logger', {});

    if (this.$el.current) {
      this.$el.current.dispatchEvent(this.event);
    }

    this.ctx = null;
    this.width = 0;
    this.height = 0;

    this.onresize = this.onresize.bind(this);
    this.onmouseup = this.onmouseup.bind(this);
    this.onmousemove = this.onmousemove.bind(this);
    this.onmousedown = this.onmousedown.bind(this);
  }

  onresize() {
    if (this.ctx) {
      if (!this.canvas.current) return;
      this.width = this.canvas.current.clientWidth;
      this.height = this.canvas.current.clientHeight;
      const width = +this.width;
      const height = +this.height;

      this.renderer.setSize(this.width, this.height);
      this.camera.left = -width / 2;
      this.camera.right = width / 2;
      this.camera.top = height / 2;
      this.camera.bottom = -this.height / 2;
      this.camera.updateProjectionMatrix();
      this.earth.updateRadius(.45 * height);
      // this.messageBox.updateRadius(.465 * height);
      this.renderer.setSize(this.width, this.height);
    }
  }

  onmouseup(e: MouseEvent) {
    if (!this.hasMove) {
      e.preventDefault();
      const left = this.canvas.current.getBoundingClientRect().left;
      const top = this.canvas.current.getBoundingClientRect().top;
      const x = e.clientX - left;
      const y = e.clientY - top;
      this.mouse.x = x / (+this.width) * 2 - 1;
      this.mouse.y = -y / (+this.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersect = this.raycaster.intersectObjects([this.earth.mesh]);
      if (intersect.length > 0) {
        // const point = intersect[0].point;
        //  c = k(s);
        //   u = c.tn;
        //    l = c.ty;
        //     h = 180 * l / Math.PI;
        //      d = 180 * u / Math.PI;
        //       p = Q(h),
        //   f = Q(d);
        // this.messageBox.updateRotate(u, l, p, f)
      }
    }
  }

  onmousemove() {
    this.hasMove = true;
  }

  onmousedown() {
    this.hasMove = false;
  }

  init() {
    if (this.canvas.current) {
      this.onresize();

      this.hasMove = false;
      this.scene = new THREE.Scene();
      this.renderer = new THREE.WebGLRenderer({
        context: createContext(this.canvas.current, {
          antialias: false,
          depth: false,
          stencil: false,
          alpha: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: true,
        }),
        alpha: true,
        antialias: true,
      });
      this.camera = new THREE.OrthographicCamera(-this.width / 2, +this.width / 2, +this.height / 2, -this.height / 2);
      this.group = new THREE.Group();
      this.earth = new ThreeEarth({
        radius: .45 * (+this.height),
      });
      this.messageBox = new MessageBox({
        radius: .465 * (+this.height),
      });
      this.mouse = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();

      this.initRenderer();
      this.initLight();
      this.initThings();
      this.initCamera();

      this.animate();
    }
  }

  initRenderer() {
    this.renderer.setSize(this.canvas.current.width, this.canvas.current.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  initLight() {
    this.scene.fog = new THREE.FogExp2(16777215, .002);
    const light = new THREE.AmbientLight(15987699);
    this.scene.add(light);
  }

  initThings() {
    this.group.add(this.earth.mesh);
    // this.group.add(this.messageBox.group);
    this.scene.add(this.group);
  }

  initCamera() {
    this.camera.position.set(440, 0, -330);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement.domElement);
    this.controls.enableZoom = false;
    this.controls.rotateSpeed = 2;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1;
    this.controls.enableDamping = false;
    this.controls.enablePan = false;
  }

  draw() {
    this.counter += 1;
    if (this.counter % 2 === 0) {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  animate() {
    // this.messageBox.animate();
    this.draw();
    window.requestAnimationFrame(this.animate.bind(this));
  }

  handleCanvasClick(event: MouseEvent) {
    // const { clientX, clientY } = event;
  }

  handleCanvasMouseMove(event: MouseEvent) {
    // const { clientX, clientY } = event;
  }

  componentDidMount() {
    if (this.canvas) {
      this.init();
    }

    console.log(this);

    window.addEventListener('resize', this.onresize);
    document.addEventListener('mousemove', this.onmousemove, false);
    document.addEventListener('mousedown', this.onmousedown, false);
    document.addEventListener('mouseup', this.onmouseup, false);

    // this.dispatchEvent(this.event, {});
  }

  componentWillReceiveProps() {}

  render() {
    // const { children } = this.props;
    // @ts-ignore
    return (<div ref={this.$el} className="map-content" style={this.style}>
      <canvas
        ref={this.canvas}
        className="map-content"
        onClick={((event1: MouseEvent<HTMLCanvasElement, MouseEvent>) => this.handleCanvasClick(event1))}
        onMouseMove={((event1: MouseEvent<HTMLCanvasElement, MouseEvent>) => this.handleCanvasMouseMove(event1))}
      />
    </div>);
  }
}

export default Earth;
