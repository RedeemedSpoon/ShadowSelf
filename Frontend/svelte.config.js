import adapter from 'svelte-adapter-bun';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: 'build',
      assets: true,
      precompress: {
        brotli: true,
        gzip: true,
        files: ['html', 'js', 'json', 'css', 'svg', 'xml', 'wasm'],
        development: false,
        dynamic_origins: true,
        xff_depth: 1,
      },
    }),
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
