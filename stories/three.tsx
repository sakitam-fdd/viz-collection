import React from 'react';
import { storiesOf } from '@storybook/react';
import Earth from './components/three/Earth';
// @ts-ignore
import * as markdownNotes from './components/Button/index.md';

storiesOf('THREE', module)
  .add('earth', () => (
    <Earth />
  ), {
    notes: { markdown: markdownNotes },
  });
