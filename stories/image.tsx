import React from 'react';
import { storiesOf } from '@storybook/react';
import PickerColor from './components/ImageGl/PickerColor';
// @ts-ignore
import * as PickerColorMd from './components/ImageGl/PickerColor.md';
// import { action } from '@storybook/addon-actions';

storiesOf('PickerColor', module)
  .add('index', () => (
    <PickerColor />
  ), {
    notes: { markdown: PickerColorMd },
  });
