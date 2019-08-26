import 'mapbox-gl/dist/mapbox-gl.css';
import * as React from 'react';
// @ts-ignore
import * as mapboxgl from 'mapbox-gl';
import { getData } from '../../utils/common';

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
      zoom: 5,
    });

    map.on('load', () => {
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
              -50, 'rgb(0,0,255)',
              -30, 'rgb(0,20,255)',
              -28, 'rgb(0,68,255)',
              -26, 'rgb(0,102,255)',
              -24, 'rgb(0,132,255)',
              -22, 'rgb(0,166,255)',
              -20, 'rgb(0,200,255)',
              -18, 'rgb(0,234,255)',
              -16, 'rgb(0,255,247)',
              -14, 'rgb(0,255,212)',
              -12, 'rgb(0,255,179)',
              -10, 'rgb(0,255,144)',
              -8, 'rgb(0,255,115)',
              -6, 'rgb(0,255,81)',
              -4, 'rgb(0,255,47)',
              -2, 'rgb(0,255,13)',
              0, 'rgb(17,255,0)',
              2, 'rgb(51,255,0)',
              4, 'rgb(85,255,0)',
              6, 'rgb(119,255,0)',
              8, 'rgb(149,255,0)',
              10, 'rgb(183,255,0)',
              12, 'rgb(217,255,0)',
              14, 'rgb(251,255,0)',
              16, 'rgb(255,229,0)',
              18, 'rgb(255,195,0)',
              20, 'rgb(255,162,0)',
              22, 'rgb(255,128,0)',
              24, 'rgb(255,98,0)',
              26, 'rgb(255,64,0)',
              28, 'rgb(255,45,0)',
              30, 'rgb(255,35,0)',
              32, 'rgb(255,20,0)',
              35, 'rgb(255,0,0)',
            ],
          },
        });
      });
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
