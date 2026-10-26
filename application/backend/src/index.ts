import {log, reportFailure} from '@logging';

async function start() {
  const {warnMissingConfiguration} = await import('@core/config');
  warnMissingConfiguration();

  const {createApp} = await import('./app');
  const app = createApp().listen({port: 3000, idleTimeout: 150, reusePort: false});

  log('success', `API listening on ${app.server?.hostname}:${app.server?.port}`);

  if (process.env.NODE_ENV !== 'test') {
    const {initBackgroundWorkers} = await import('@core/background-workers');
    initBackgroundWorkers();
  }
}

void start().catch((failure) => {
  reportFailure('API startup', failure);
  process.exitCode = 1;
});
