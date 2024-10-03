// import adapter from '@sveltejs/adapter-bun';
import adapter from '@sveltejs/adapter-auto';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $lib: 'src/lib/index.ts',
      $store: 'src/lib/store.ts',
      $components: 'src/lib/components',
      $images: 'src/lib/images',
      $types: 'src/lib/types.ts',
    },
  },
};

export default config;
