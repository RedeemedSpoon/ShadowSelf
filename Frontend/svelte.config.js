import adapter from 'svelte-adapter-bun';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    csrf: {checkOrigin: false},
    adapter: adapter({
      out: 'build',
      assets: true,
      development: false,
      dynamic_origins: true,
      xff_depth: 1,
      precompress: {
        gzip: true,
        brotli: false,
        files: ['html', 'js', 'json', 'css', 'svg', 'xml', 'wasm'],
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
