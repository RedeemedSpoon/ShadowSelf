import {deployment} from './deployment.js';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import adapter from 'svelte-adapter-bun';

function allowedOrigins(setting) {
  return (process.env[setting] ?? deployment[setting] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const url = new URL(value);

      if (url.protocol !== 'https:' || url.origin !== value) {
        throw new Error(`${setting} must contain exact HTTPS origins`);
      }

      return url.origin;
    });
}

function moneroOrigins() {
  return [deployment.XMR_NODE, deployment.XMR_NODE_FALLBACKS]
    .filter(Boolean)
    .join(',')
    .split(',')
    .filter(Boolean)
    .map((value) => {
      const url = new URL(value.trim());

      if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
        throw new Error('Monero nodes must use HTTPS without credentials or fragments');
      }

      return url.origin;
    });
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    env: {dir: '..'},
    csrf: {trustedOrigins: []},
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self', 'wasm-unsafe-eval', ...allowedOrigins('CSP_SCRIPT_ORIGINS')],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:', 'https:'],
        'connect-src': ['self', ...allowedOrigins('CSP_CONNECT_ORIGINS'), ...moneroOrigins()],
        'frame-src': ['self', 'blob:', ...allowedOrigins('CSP_FRAME_ORIGINS')],
        'worker-src': ['self', 'blob:'],
        'font-src': ['self', 'data:'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
      },
    },
    adapter: adapter({out: 'build', serveAssets: true, precompress: true}),
    alias: {
      $image: 'src/lib/images',
      $logging: '../logging.ts',
      $utils: 'src/lib/utils',
      $component: 'src/lib/components',
      $type: 'src/lib/types.ts',
      $store: 'src/lib/stores.ts',
      $constant: 'src/lib/constants/index.ts',
      $style: 'src/app.css',
    },
  },
};

export default config;
