import {initBackgroundWorkers} from '@core/background-workers';
import {createApp} from './app';

async function start() {
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
