import {loadEnv} from 'vite';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import adapter from 'svelte-adapter-bun';

const deployment = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'CSP_');
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

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    csrf: {trustedOrigins: []},
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self', 'wasm-unsafe-eval', ...allowedOrigins('CSP_SCRIPT_ORIGINS')],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:', 'https:'],
        'connect-src': ['self', ...allowedOrigins('CSP_CONNECT_ORIGINS')],
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
