import 'maptalks/dist/maptalks.css';
import * as React from 'react';
// @ts-ignore
import { Map, GeoJSON, VectorLayer, TileLayer } from 'maptalks';
import { values, colors } from '../../utils/common';
// @ts-ignore
import TiffDecode from '../../worker/tiffDecode.worker';

export interface PageProps {}

export interface PageState {}

class Maptalks extends React.Component<PageProps, PageState> {
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
      const geometries = GeoJSON.toGeometry(data);
      const layer = new VectorLayer('2', geometries, {
        enableSimplify: true,
        style: [
          ...values.map((val: number, index: number) => ({
            filter: ['==', 'value', val],
            symbol: {
              lineColor : '#34495e',
              lineWidth : 0,
              polygonFill : colors[index],
              polygonOpacity : 0.5,
            },
          })),
        ],
      });
      this.map.addLayer(layer);
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

export default Maptalks;
