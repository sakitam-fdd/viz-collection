import 'maptalks/dist/maptalks.css';
import * as React from 'react';
// @ts-ignore
import { Map, TileLayer } from 'maptalks';
// @ts-ignore
import RadarReader from '../../worker/radarReader.worker';

import { getImageData, loadImage } from '../../utils/common';

export interface PageProps {}

export interface PageState {}

class CanvasImageReader extends React.Component<PageProps, PageState> {
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
      zoom: 2,
      pitch: 0,
      bearing: 0,
      minZoom: 0,
      maxZoom: 18,
      // spatialReference: {
      //   projection: 'EPSG:4326',
      // },
      baseLayer: new TileLayer('base', {
        // spatialReference: {
        //   projection: 'EPSG:3857',
        // },
        // tslint:disable-next-line:max-line-length
        urlTemplate: 'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
        // urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        // subdomains: ['a','b','c','d'],
      }),
    });

    // TODO: 路径必须是完整地址
    // this.initWorker('201907021018_042', 'http://localhost:3003/data/201907021018_042.png');
    loadImage('http://localhost:3003/data/201907021018_042.png')
      .then((image: any) => {
        getImageData(image).then((res: any) => {
          this.initWorker('201907021018_042', res);
        });
      });
  }

  componentDidMount() {
    if (this.container) {
      this.initMap();
    }
  }

  initWorker(url: string, image: any) {
    this.worker = new RadarReader();

    if (this.worker) {
      this.worker.addEventListener('message', this.onMessage);
      this.worker.postMessage(['decodeData', url, image]);
    }
  }

  onMessage({ data: payload }: any) {
    const { type, status, data } = payload;
    console.log(type);
    if (status === 'success') {
      if (type === 'decodeData') {
        this.map.on('mousemove', (event: any) => {
          // @ts-ignore
          this.worker.postMessage(['queryData', '201907021018_042', {
            lon: event.coordinate.x,
            lat: event.coordinate.y,
            maxResults: 1,
          }]);
        });
      } else if (type === 'queryData') {
        console.log(data);
      }
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

export default CanvasImageReader;
