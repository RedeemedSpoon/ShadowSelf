import adapter from '@sveltejs/adapter-auto';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $components: 'src/lib/components',
      $images: 'src/lib/images',
      $lib: 'src/lib/index.ts',
      $types: 'src/lib/types.ts',
      $store: 'src/lib/store.ts',
      $cn: 'src/lib/cn.ts',
    },
  },
};

export default config;
