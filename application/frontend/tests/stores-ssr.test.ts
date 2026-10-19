import {expect, mock, test} from 'bun:test';
import {get} from 'svelte/store';

mock.module('$app/environment', () => ({browser: false}));

const {identity, vaultKey, moneroData} = await import('../src/lib/stores');

test('server rendering cannot write identity secrets into shared module state', () => {
  expect(() => identity.set(null)).toThrow('only be changed in the browser');
  expect(() => vaultKey.update(() => null)).toThrow('only be changed in the browser');
  expect(() => moneroData.set({address: 'synthetic', viewKey: 'synthetic', spendKey: 'synthetic'})).toThrow(
    'only be changed in the browser',
  );
  expect(get(identity)).toBeNull();
  expect(get(vaultKey)).toBeNull();
  expect(get(moneroData)).toEqual({address: '', viewKey: '', spendKey: ''});
});
