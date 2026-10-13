import {expect, test} from 'bun:test';
import {createRequestLimiter, requestClientIP} from '@core/request-limits';

test('rate limit windows reset at their exact expiry without waiting for global cleanup', () => {
  let now = 0;
  const limit = createRequestLimiter(() => now);

  limit('client', 1, 50);
  expect(() => limit('client', 1, 50)).toThrow('Too many requests');

  now = 50;
  expect(() => limit('client', 1, 50)).not.toThrow();
});

test('expired capacity can be reclaimed while unexpired clients remain limited', () => {
  let now = 0;
  const limit = createRequestLimiter(() => now);

  for (let index = 0; index < 10000; index++) {
    limit(String(index), 1, index === 0 ? 1000 : 50);
  }

  expect(() => limit('new', 1, 50)).toThrow('busy');

  now = 100;

  expect(() => limit('new', 1, 50)).not.toThrow();
  expect(() => limit('0', 1, 50)).toThrow('Too many requests');
});

test('forwarded addresses are ignored from an untrusted peer and invalid proxy chains', () => {
  expect(requestClientIP('192.0.2.1', '203.0.113.1', ['192.0.2.2'])).toBe('192.0.2.1');
  expect(requestClientIP('192.0.2.2', '203.0.113.1, attacker', ['192.0.2.2'])).toBe('192.0.2.2');
  expect(requestClientIP('::ffff:192.0.2.2', '203.0.113.1', ['192.0.2.2'])).toBe('203.0.113.1');
});
