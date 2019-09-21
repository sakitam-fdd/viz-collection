import 'ol/ol.css';
import * as React from 'react';
// @ts-ignore
import geojsonvt from 'geojson-vt';
import { Map, View } from 'ol';
// @ts-ignore
import { GeoJSON } from 'ol/format';
// @ts-ignore
import { fromLonLat, Projection } from 'ol/proj';
// @ts-ignore
import { Tile as TileLayer, VectorTile as VectorTileLayer } from 'ol/layer';
// @ts-ignore
import { XYZ, VectorTile as VectorTileSource } from 'ol/source';
// @ts-ignore
import { Fill, Style, Stroke } from 'ol/style';
import { values, colors, replacer } from '../../utils/common';
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

    // this.initWorker('http://localhost:3003/data/201908252200.tif', 'getData');
    this.initWorker('http://localhost:3003/json/chinaRegions.json', 'GeoJSON');
  }

  componentDidMount() {
    if (this.container) {
      this.initMap();
    }
  }

  initWorker(url: string, type: string) {
    this.worker = new Vt();

    if (this.worker) {
      this.worker.addEventListener('message', this.onMessage);
      this.worker.postMessage({
        url,
        action: type,
      });
    }
  }

  onMessage({ data: payload }: any) {
    const { type, status, data } = payload;
    if (!this.worker) return;
    let tileIndex: any;
    if (type === 'getData' && status === 'success') {
      // this.worker.postMessage({
      //   data,
      //   action: 'create-vt',
      // });
      tileIndex = geojsonvt(payload.data, {
        extent: 4096,
        debug: 1,
      });
      const layer = new VectorTileLayer({
        source: new VectorTileSource({
          format: new GeoJSON(),
          tileLoadFunction: (tile: any) => {
            const format = tile.getFormat();
            const tileCoord = tile.getTileCoord();
            const tileData = tileIndex.getTile(tileCoord[0], tileCoord[1], -tileCoord[2] - 1);
            const featureString = JSON.stringify({
              type: 'FeatureCollection',
              features: tileData ? tileData.features : [],
            }, replacer);
            const features = format.readFeatures(featureString);
            tile.setLoader(() => {
              tile.setFeatures(features);
              tile.setProjection(tilePixels);
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
    } else if (type === 'GeoJSON' && status === 'success') {
      tileIndex = geojsonvt(payload.data, {
        extent: 4096,
        debug: 1,
      });
      const layer = new VectorTileLayer({
        source: new VectorTileSource({
          format: new GeoJSON(),
          tileLoadFunction: (tile: any) => {
            const format = tile.getFormat();
            const tileCoord = tile.getTileCoord();
            const tileData = tileIndex.getTile(tileCoord[0], tileCoord[1], -tileCoord[2] - 1);
            const featureString = JSON.stringify({
              type: 'FeatureCollection',
              features: tileData ? tileData.features : [],
            }, replacer);
            const features = format.readFeatures(featureString);
            tile.setLoader(() => {
              tile.setFeatures(features);
              tile.setProjection(tilePixels);
            });
          },
          url: 'data:', // arbitrary url, we don't use it in the tileLoadFunction
          wrapX: false,
        }),
        style: new Style({
          stroke: new Stroke({
            color: '#ef6a00',
            lineDash: [4],
            width: 1.5,
          }),
          // fill: new Fill({
          //   color: '#ef6a00',
          // }),
        }),
      });
      this.map.addLayer(layer);
    } else if (type === 'create-vt') {
      const layer = new VectorTileLayer({
        format: new GeoJSON(),
        source: new VectorTileSource({
          tileLoadFunction: (tile: any) => {
            const format = tile.getFormat();
            const tileCoord = tile.getTileCoord();
            const data = tileIndex.getTile(tileCoord[0], tileCoord[1], -tileCoord[2] - 1);
            const featureString = JSON.stringify({
              type: 'FeatureCollection',
              features: data ? data.features : [],
            }, replacer);
            const features = format.readFeatures(featureString);
            tile.setLoader(() => {
              tile.setFeatures(features);
              tile.setProjection(tilePixels);
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
    } else if (type === 'getTile') {
      // FIXME: don't use
      const tile = payload.tile;
      const format = tile.getFormat();
      const features = format.readFeatures(data);
      tile.setLoader(() => {
        tile.setFeatures(features);
        tile.setProjection(tilePixels);
      });
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
