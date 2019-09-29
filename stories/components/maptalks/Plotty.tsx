import 'maptalks/dist/maptalks.css';
import * as React from 'react';
// @ts-ignore
import { Map, TileLayer } from 'maptalks';

import { Plotty as PlottyLayer } from '../../../src';

export interface PageProps {}

export interface PageState {}

class MaptalksVectorTile extends React.Component<PageProps, PageState> {
  private container: React.RefObject<HTMLElement>;
  private style: { width: string; height: string };

  private map: Map;
  constructor(props: PageProps, context: any) {
    super(props, context);

    this.container = React.createRef();

    this.style = {
      height: '100vh',
      width: '100vw',
    };
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

    console.log(this.map);

    const layer = new PlottyLayer('plotty', [
      {
        url: 'http://localhost:3003/data/201908252200.tif',
        opacity: 1,
        extent: [-180, -90, 180, 90], // 全球
      },
    ], {
      renderer: 'canvas',
    });
    this.map.addLayer(layer);
  }

  componentDidMount() {
    if (this.container) {
      this.initMap();
    }
  }

  componentWillReceiveProps() {}

  componentWillUnmount(): void {
  }

  render() {
    // const { children } = this.props;
    // @ts-ignore
    return (<div ref={this.container} className="map-content" style={this.style} />);
  }
}

export default MaptalksVectorTile;
