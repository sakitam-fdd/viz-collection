import 'maptalks/dist/maptalks.css';
// @ts-ignore
import * as THREE from 'three';
import * as React from 'react';
// @ts-ignore
import { Map, GeoJSON, TileLayer } from 'maptalks';
import { colorThreeHex } from '../../utils/color';
import { values, colors } from '../../utils/common';
import ThreeLayer from '../../layers/ThreeLayer';
// @ts-ignore
import TiffDecode from '../../worker/tiffDecode.worker';

export interface PageProps {}

export interface PageState {}

class ThreePolygon extends React.Component<PageProps, PageState> {
  private container: React.RefObject<HTMLElement>;
  private style: { width: string; height: string };

  private worker: Worker | undefined;
  private map: Map;
  constructor(props: PageProps, context: any) {
    super(props, context);

    this.container = React.createRef();

    this.style = {
      height: '100vh',
      width: '100vw',
    };

    this.onMessage = this.onMessage.bind(this);
  }

  initMap() {
    this.map = new Map(this.container.current, {
      center: [120.2, 30.2],
      zoom: 5,
      pitch: 0,
      bearing: 0,
      minZoom: 0,
      maxZoom: 24,
      baseLayer: new TileLayer('base', {
        // tslint:disable-next-line:max-line-length
        urlTemplate: 'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
        // urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        // subdomains: ['a','b','c','d'],
      }),
    });

    // TODO: 路径必须是完整地址
    this.initWorker('http://localhost:3003/data/201908252200.tif');
  }

  componentDidMount() {
    if (this.container) {
      this.initMap();
    }
  }

  initWorker(url: string) {
    this.worker = new TiffDecode();

    if (this.worker) {
      this.worker.addEventListener('message', this.onMessage);
      this.worker.postMessage({
        url,
        action: 'getData',
      });
    }
  }

  onMessage({ data: payload }: any) {
    const { status, data } = payload;
    const filters: (string | number)[] = [];
    values.forEach((item: number, idx: number) => {
      filters.push(item);
      filters.push(colors[idx]);
    });
    if (status === 'success') {
      const features = data.features;
      // const geometries = GeoJSON.toGeometry(data);
      const threeLayer = new ThreeLayer('t', {
        forceRenderOnMoving : false,
        forceRenderOnRotating : false,
      });
      // @ts-ignore
      threeLayer.prepareToDraw = function (gl: WebGLRenderingContext, scene: any) {
        // tslint:disable-next-line:no-this-assignment
        const me = this;
        // var light = new THREE.DirectionalLight(0xffffff);
        const light = new THREE.AmbientLight(0xffffff);
        // light.position.set(0, -10, 10).normalize();
        scene.add(light);
        const meshs = [];
        for (let i = 0, len = features.length; i < len; i++) {
          const feature = features[i];
          if (feature.geometry.coordinates.length > 0) {
            const color = colorThreeHex(feature.properties.color);
            const m = new THREE.MeshPhongMaterial({ color, opacity : 0.7 });
            // m.side = THREE.BackSide;
            const mesh = me.toExtrudeMesh(GeoJSON.toGeometry(feature), 0, m, 0);
            if (Array.isArray(mesh)) {
              meshs.push(...mesh);
            } else {
              // scene.add(mesh);
              meshs.push(mesh);
            }
          }
        }
        scene.add.apply(scene, meshs);
      };
      this.map.addLayer(threeLayer);
    }
  }

  componentWillReceiveProps() {}

  componentWillUnmount(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  render() {
    // const { children } = this.props;
    // @ts-ignore
    return (<div ref={this.container} className="map-content" style={this.style} />);
  }
}

export default ThreePolygon;
