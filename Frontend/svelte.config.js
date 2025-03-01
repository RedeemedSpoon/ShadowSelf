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
      $component: 'src/lib/components',
      $image: 'src/lib/images',
      $icon: 'src/lib/icons',
      $type: 'src/lib/types.ts',
      $store: 'src/lib/stores.ts',
      $lib: 'src/lib/index.ts',
      $dom: 'src/lib/dom.ts',
      $cn: 'src/lib/cn.ts',
    },
  },
};

export default config;
