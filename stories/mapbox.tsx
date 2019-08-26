import React from 'react';
import { storiesOf } from '@storybook/react';
import Mapbox from './components/mapbox';
// @ts-ignore
import * as markdownNotes from './components/Button/index.md';
// import { action } from '@storybook/addon-actions';

storiesOf('Mapbox', module)
  .add('index', () => (
    <Mapbox />
  ), {
    notes: { markdown: markdownNotes },
  });
