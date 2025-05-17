import {sveltekit} from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {assetsInlineLimit: 0},
  plugins: [tailwindcss(), sveltekit()],
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
