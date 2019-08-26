import 'mapbox-gl/dist/mapbox-gl.css';
import * as React from 'react';
// @ts-ignore
import * as mapboxgl from 'mapbox-gl';
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
    mapboxgl.accessToken = 'pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2owbDBkb2RwMDJyMTMycWRoeDE4d21sZSJ9.dWlPeAWsgnhUKdv1dCLTnw';

    const map = new mapboxgl.Map({
      container: this.container.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [120.2, 30.2],
      zoom: 1,
    });

    map.on('load', () => {
      const filters: (string | number)[] = [];
      values.forEach((item: number, idx: number) => {
        filters.push(item);
        filters.push(colors[idx]);
      });
      getData('./data/201908252200.tif').then((res: any) => {
        map.addLayer({
          id: 'maine',
          type: 'fill',
          source: {
            type: 'geojson',
            data: res,
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
      });
    });
  }

  componentDidMount() {
    if (this.container) {
      this.initMap();
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
