import 'mapbox-gl/dist/mapbox-gl.css';
import * as React from 'react';
// @ts-ignore
import * as mapboxgl from 'mapbox-gl';
import { values, colors } from '../../utils/common';
// worker-loader!
// @ts-ignore
import TransformData from '../../worker/transformData.worker';

export interface PageProps {}

export interface PageState {}

class Mapbox extends React.Component<PageProps, PageState> {
  private container: React.RefObject<HTMLElement>;
  private style: { width: string; height: string };

  private worker: Worker | undefined;

  private map: any;
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
    mapboxgl.accessToken = 'pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2owbDBkb2RwMDJyMTMycWRoeDE4d21sZSJ9.dWlPeAWsgnhUKdv1dCLTnw';

    const map = new mapboxgl.Map({
      container: this.container.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [120.2, 30.2],
      zoom: 1,
    });

    map.on('load', () => {
      fetch('./data/201908252200.tif', {
        method: 'GET',
      })
        .then((response) => {
          return response.arrayBuffer();
        })
        .then((arrayBuffer: any) => {
          this.initWorker(arrayBuffer);
        });
    });

    map.on('sourcedataloading', (e: any) => { // 数据加载完成
      console.log(e);
    });

    this.map = map;
  }

  initWorker(data: any) {
    this.worker = new TransformData();

    if (this.worker) {
      this.worker.addEventListener('message', this.onMessage);
      this.worker.postMessage({
        data,
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
      this.map.addLayer({
        id: 'maine',
        type: 'fill',
        source: {
          data,
          type: 'geojson',
        },
        layout: {},
        paint: {
          'fill-color': [
            'match',
            ['get', 'value'],
            ...filters,
            'rgba(255, 255, 255, 0)',
          ],
        },
      });
    }
  }

  componentDidMount() {
    if (this.container) {
      this.initMap();
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

export default Mapbox;
