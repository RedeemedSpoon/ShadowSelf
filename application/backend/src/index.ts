import {initBackgroundWorkers} from '@core/background-workers';
import {createApp} from './app';
import {resolveTrustedProxyHosts, refreshTrustedProxyHosts} from '@core/config';

async function start() {
  await resolveTrustedProxyHosts();
  refreshTrustedProxyHosts();

  const app = createApp().listen(Number(process.env.PORT || 3000));

  if (process.env.NODE_ENV !== 'test') {
    initBackgroundWorkers();
  }

  console.log(`ShadowSelf API listening on ${app.server?.hostname}:${app.server?.port}`);
}

void start().catch(() => {
  console.error('API startup failed');
  process.exitCode = 1;
});
