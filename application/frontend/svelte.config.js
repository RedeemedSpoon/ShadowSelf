import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import adapter from 'svelte-adapter-bun';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    csrf: {trustedOrigins: []},
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self', 'wasm-unsafe-eval', 'https://js.stripe.com'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:', 'https:'],
        'connect-src': [
          'self',
          'https://api.stripe.com',
          'https://mempool.space',
          'https://litecoinspace.org',
          'https://eth.blockscout.com',
          'https://xmr-node.cakewallet.com:18081',
        ],
        'frame-src': ['self', 'blob:', 'https://js.stripe.com', 'https://hooks.stripe.com'],
        'worker-src': ['self', 'blob:'],
        'font-src': ['self', 'data:'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
      },
    },
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
