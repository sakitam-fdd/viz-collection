import React from 'react';
import { storiesOf } from '@storybook/react';
import Plotty from './components/maptalks/Plotty';
import Maptalks from './components/maptalks';
import GeoJSONVT from './components/maptalks/GeoJSONVT';
import ThreePolygon from './components/maptalks/ThreePolygon';
import MapboxVector from './components/maptalks/MapboxVector';
import MaptalksVectorTile from './components/maptalks/vectorTile';
import CanvasImageReader from './components/image-reader/canvas-image-reader';
// @ts-ignore
import * as markdownNotes from './components/Button/index.md';
// import { action } from '@storybook/addon-actions';

storiesOf('maptalks', module)
  .add('index', () => (
    <Maptalks />
  ), {
    notes: { markdown: markdownNotes },
  })
  .add('mapbox-vector', () => (
    <MapboxVector />
  ))
  .add('geojson-vt', () => (
    <GeoJSONVT />
  ))
  .add('vector', () => (
    <MaptalksVectorTile />
  ), {
    notes: { markdown: markdownNotes },
  })
  .add('three', () => (
    <ThreePolygon />
  ), {
    notes: { markdown: markdownNotes },
  })
  .add('plotty', () => (
    <Plotty />
  ), {
    notes: { markdown: markdownNotes },
  })
  .add('image-radar', () => (
    <CanvasImageReader />
  ), {
    notes: { markdown: markdownNotes },
  });
