import React from 'react';
import { storiesOf } from '@storybook/react';
import Maptalks from './components/maptalks';
import ThreePolygon from './components/maptalks/ThreePolygon';
import MapboxVector from './components/maptalks/MapboxVector';
import MaptalksVectorTile from './components/maptalks/vectorTile';
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
  .add('vector', () => (
    <MaptalksVectorTile />
  ), {
    notes: { markdown: markdownNotes },
  })
  .add('three', () => (
    <ThreePolygon />
  ), {
    notes: { markdown: markdownNotes },
  });
