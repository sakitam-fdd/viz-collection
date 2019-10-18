import React from 'react';
import { storiesOf } from '@storybook/react';
import Earth from './components/three/Earth';
import ThreeOffscreen from './components/offscreen/ThreeOffscreen';
import ThreeOffscreenClass from './components/offscreen/ThreeOffscreenClass';
// @ts-ignore
import * as markdownNotes from './components/offscreen/index.md';

storiesOf('THREE', module)
  .add('earth', () => (
    <Earth />
  ), {
    notes: { markdown: markdownNotes },
  })
  .add('ThreeOffscreen', () => (
    <ThreeOffscreen />
  ), {
    notes: { markdown: markdownNotes },
  })
  .add('ThreeOffscreenClass', () => (
    <ThreeOffscreenClass />
  ), {
    notes: { markdown: markdownNotes },
  });
