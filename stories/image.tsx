import React from 'react';
import { storiesOf } from '@storybook/react';
import { actions } from '@storybook/addon-actions';
import PickerColor from './components/ImageGl/PickerColor';
// @ts-ignore
import * as PickerColorMd from './components/ImageGl/PickerColor.md';

const eventsFromObject = actions({
  logger: 'logger',
});

storiesOf('PickerColor', module)
  .add('index', () => (
    <PickerColor {...eventsFromObject} />
  ), {
    notes: { markdown: PickerColorMd },
  });
