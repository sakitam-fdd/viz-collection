import React from 'react';
import { storiesOf } from '@storybook/react';
// @ts-ignore
import Button from './components/Button';
// @ts-ignore
import * as markdownNotes from './components/Button/index.md';
// import { action } from '@storybook/addon-actions';

storiesOf('Button', module)
  .add('with text', () => (
    <Button>Hello Button</Button>
), {
  notes: { markdown: markdownNotes },
});
