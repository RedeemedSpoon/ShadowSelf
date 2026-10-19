import {expect, test} from 'bun:test';

const cwd = new URL('../', import.meta.url).pathname;
const expression = `const {default: config} = await import('./svelte.config.js'); console.log(JSON.stringify(config.kit.csp.directives));`;

test('CSP uses deployment origins without built-in provider hosts', () => {
  const result = Bun.spawnSync([process.execPath, '-e', expression], {
    cwd,
    env: {
      ...process.env,
      CSP_CONNECT_ORIGINS: 'https://node.synthetic.test',
      CSP_SCRIPT_ORIGINS: '',
      CSP_FRAME_ORIGINS: '',
    },
  });
  const directives = JSON.parse(result.stdout.toString());

  expect(result.exitCode).toBe(0);
  expect(directives['connect-src']).toEqual(['self', 'https://node.synthetic.test']);
  expect(directives['script-src']).toEqual(['self', 'wasm-unsafe-eval']);
  expect(directives['frame-src']).toEqual(['self', 'blob:']);
});

test('CSP refuses insecure or non-origin allowlist entries', () => {
  for (const origin of ['http://insecure.synthetic.test', 'https://node.synthetic.test/path', '*']) {
    const result = Bun.spawnSync([process.execPath, '-e', expression], {
      cwd,
      env: {...process.env, CSP_CONNECT_ORIGINS: origin},
    });

    expect(result.exitCode).not.toBe(0);
  }
});
