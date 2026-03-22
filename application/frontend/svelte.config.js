import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import adapter from 'svelte-adapter-bun';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    csrf: {trustedOrigins: ['*']},
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
      $icon: 'src/lib/icons',
      $image: 'src/lib/images',
      $utils: 'src/lib/utils',
      $component: 'src/lib/components',
      $type: 'src/lib/types.ts',
      $store: 'src/lib/stores.ts',
      $constant: 'src/lib/constants.ts',
      $tailwind: 'tailwind.config.js',
      $style: 'src/app.css',
    },
  },
};

export default config;
