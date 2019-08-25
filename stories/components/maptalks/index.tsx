import * as React from 'react';
// @ts-ignore
import { Map, GeoJSON, VectorLayer, TileLayer } from 'maptalks';

export interface PageProps {}

export interface PageState {}

class Maptalks extends React.Component<PageProps, PageState> {
  private container: HTMLElement | null;
  constructor(props: PageProps, context: any) {
    super(props, context);

    this.container = null;
  }

  initMap() {
    const map = new Map(this.container, {
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

    const data = GeoJSON.toGeometry(res);
    const layer = new VectorLayer('2', data, {
      enableSimplify: true,
      style: [
        ...values.map((val, index) => ({
          'filter': ['==', 'value', val],
          'symbol': {
            'lineColor' : '#34495e',
            'lineWidth' : 0,
            'polygonFill' : colors[index],
            'polygonOpacity' : 0.5
          }
        }))
      ]
    });
    map.addLayer(layer);
    console.log(layer.getGeometries());
  }

  componentDidMount() {
  }

  componentWillReceiveProps() {}

  setRef(x: HTMLElement) {
    this.container = x;
  }

  render() {
    const { children } = this.props;
    console.log(children);
    return (<div ref={this.setRef} className="map-content" />);
  }
}

export default Maptalks;
