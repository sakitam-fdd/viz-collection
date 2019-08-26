import React from 'react';
import { storiesOf } from '@storybook/react';
import Openlayers from './components/ol';
// @ts-ignore
import * as markdownNotes from './components/Button/index.md';
// import { action } from '@storybook/addon-actions';

storiesOf('ol', module)
  .add('index', () => (
    <Openlayers />
  ), {
    notes: { markdown: markdownNotes },
  });
