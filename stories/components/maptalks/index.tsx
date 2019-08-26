import 'maptalks/dist/maptalks.css';
import * as React from 'react';
// @ts-ignore
import { Map, GeoJSON, VectorLayer, TileLayer } from 'maptalks';
import { values, colors, getData } from '../../utils/common';

export interface PageProps {}

export interface PageState {}

class Maptalks extends React.Component<PageProps, PageState> {
  private container: React.RefObject<HTMLElement>;
  private style: { width: string; height: string };
  constructor(props: PageProps, context: any) {
    super(props, context);

    this.container = React.createRef();

    this.style = {
      height: '100vh',
      width: '100vw',
    };
  }

  initMap() {
    const map = new Map(this.container.current, {
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

    getData('./data/201908252200.tif').then((res: any) => {
      const data = GeoJSON.toGeometry(res);
      const layer = new VectorLayer('2', data, {
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
      map.addLayer(layer);
      console.log(layer.getGeometries());
    });
  }

  componentDidMount() {
    if (this.container) {
      this.initMap();
      console.log(this.container);
    }
  }

  componentWillReceiveProps() {}

  render() {
    // const { children } = this.props;
    // @ts-ignore
    return (<div ref={this.container} className="map-content" style={this.style} />);
  }
}

export default Maptalks;
