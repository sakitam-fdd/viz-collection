import { configure, addParameters } from '@storybook/react';
// https://github.com/storybookjs/storybook/issues/6998

addParameters({
  options: {
    isFullscreen: false,
    showAddonsPanel: true,
    showSearchBox: false,
    panelPosition: 'bottom',
    hierarchySeparator: /\./,
    hierarchyRootSeparator: /\|/,
    enableShortcuts: true,
  },
});


function loadStories() {
  require('../stories/index');
  // You can require as many stories as you need.
}

configure(loadStories, module);
