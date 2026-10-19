import {expect, test} from 'bun:test';
import {createRequestLimiter} from '../src/lib/request-limits.server';

test('form request limits isolate clients and recover after the window expires', () => {
  let now = 0;
  const limit = createRequestLimiter(() => now);

  for (let request = 0; request < 30; request++) {
    expect(limit('client-a', true)).toBe(true);
  }

  expect(limit('client-a', true)).toBe(false);
  expect(limit('client-b', true)).toBe(true);
  expect(limit('client-a', false)).toBe(true);

  now = 60_001;

  expect(limit('client-a', true)).toBe(true);
});
