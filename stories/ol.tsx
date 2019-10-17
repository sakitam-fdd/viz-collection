import React from 'react';
import { storiesOf } from '@storybook/react';
import Openlayers from './components/ol';
import OlVt from './components/geojson-vt';
// @ts-ignore
import * as markdownNotes from './components/offscreen/index.md';
// @ts-ignore
import * as vtNotes from './components/geojson-vt/index.md';
// import { action } from '@storybook/addon-actions';

storiesOf('ol', module)
  .add('index', () => (
    <Openlayers />
  ), {
    notes: { markdown: markdownNotes },
  })
  .add('geojson-vt', () => (
    <OlVt />
  ), {
    notes: { markdown: vtNotes },
  });
