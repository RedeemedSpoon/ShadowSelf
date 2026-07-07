import {nodePolyfills} from 'vite-plugin-node-polyfills';
import {sveltekit} from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  plugins: [
    tailwindcss(),
    sveltekit(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'http', 'https', 'fs', 'path', 'url'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    port: 5000,
    strictPort: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      clientPort: 5000,
    },
  },
});
