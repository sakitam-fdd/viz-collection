import 'ol/ol.css';
import * as React from 'react';
import { Map, View } from 'ol';
// @ts-ignore
import { fromLonLat, Projection } from 'ol/proj';
// @ts-ignore
import { Tile as TileLayer, VectorTile as VectorTileLayer } from 'ol/layer';
// @ts-ignore
import { XYZ, VectorTile as VectorTileSource } from 'ol/source';
// @ts-ignore
import { Fill, Style } from 'ol/style';
import { values, colors } from '../../utils/common';
// @ts-ignore
import Vt from '../../worker/vt.worker';

export interface PageProps {}

export interface PageState {}

const tilePixels = new Projection({
  code: 'TILE_PIXELS',
  units: 'tile-pixels',
});

class Openlayers extends React.Component<PageProps, PageState> {
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
    this.map = new Map({
      target: this.container.current,
      view: new View({
        center: fromLonLat([120.2, 30.2]),
        zoom: 5,
        // projection: 'EPSG:4326',
      }),
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://map.geoq.cn/arcgis/rest/services/' +
              'ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
          }),
        }),
      ],
    });

    this.initWorker('http://localhost:3003/data/201908252200.tif');
  }

  componentDidMount() {
    if (this.container) {
      this.initMap();
    }
  }

  initWorker(url: string) {
    this.worker = new Vt();

    if (this.worker) {
      this.worker.addEventListener('message', this.onMessage);
      this.worker.postMessage({
        url,
        action: 'getData',
      });
    }
  }

  onMessage({ data: payload }: any) {
    const { type, status, data } = payload;
    if (!this.worker) return;
    if (type === 'getData' && status === 'success') {
      this.worker.postMessage({
        data,
        action: 'create-vt',
      });
    } else if (type === 'create-vt') {
      const layer = new VectorTileLayer({
        source: new VectorTileSource({
          tileLoadFunction: (tile: any) => {
            console.log(tile);
            this.worker && this.worker.postMessage({
              tile,
              tilePixels,
              action: 'getTile',
            });
          },
          url: 'data:', // arbitrary url, we don't use it in the tileLoadFunction
          wrapX: false,
        }),
        style: (feature: any) => {
          const props = feature.getProperties();
          const idx = values.findIndex((item: number) => item === props.value);
          return new Style({
            // stroke: new ol.style.Stroke({
            //   color: 'blue',
            //   lineDash: [4],
            //   width: 0
            // }),
            fill: new Fill({
              color: colors[idx],
            }),
          });
        },
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

export default Openlayers;
