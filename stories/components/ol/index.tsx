import 'ol/ol.css';
import * as React from 'react';
import { Map, View } from 'ol';
// @ts-ignore
import { fromLonLat } from 'ol/proj';
// @ts-ignore
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
// @ts-ignore
import { XYZ, Vector as VectorSource } from 'ol/source';
// @ts-ignore
import { GeoJSON } from 'ol/format';
// @ts-ignore
import { Fill, Style } from 'ol/style';
import { values, colors, getData } from '../../utils/common';

export interface PageProps {}

export interface PageState {}

class Openlayers extends React.Component<PageProps, PageState> {
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
    const map = new Map({
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

    getData('./data/201908252200.tif').then((res: any) => {
      const layer = new VectorLayer({
        source: VectorSource({
          features: (new GeoJSON()).readFeatures(res, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          }),
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
      map.addLayer(layer);
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

export default Openlayers;
