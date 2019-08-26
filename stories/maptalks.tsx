import React from 'react';
import { storiesOf } from '@storybook/react';
import Maptalks from './components/maptalks';
// @ts-ignore
import * as markdownNotes from './components/Button/index.md';
// import { action } from '@storybook/addon-actions';

storiesOf('maptalks', module)
  .add('index', () => (
    <Maptalks />
), {
  notes: { markdown: markdownNotes },
});