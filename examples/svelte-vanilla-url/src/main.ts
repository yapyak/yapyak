import { mount } from 'svelte';

import App from './app.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Mount target not found');
}

mount(App, {
  target,
});
