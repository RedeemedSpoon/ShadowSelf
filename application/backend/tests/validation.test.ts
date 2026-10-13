import {describe, expect, test} from 'bun:test';
import {HDKey} from '@scure/bip32';
import {checkAPI, checkIdentity} from '@utils/checks';

const root = HDKey.fromMasterSeed(new Uint8Array(32).fill(7));
const encrypted = `v1.${Buffer.alloc(29).toString('base64')}`;
const keys = {
  btc: root.derive("m/84'/0'/0'").publicExtendedKey,
  ltc: root.derive("m/84'/2'/0'").publicExtendedKey,
  evm: `0x${'1'.repeat(40)}`,
  xmr: {address: encrypted, viewKey: encrypted, spendKey: encrypted},
};

function validateWallet(btc: string) {
  return checkIdentity('wallet', {wallet: {blob: encrypted, keys: {...keys, btc}}});
}

describe('wallet provisioning validation', () => {
  test('rejects a non-key with an accepted string length', async () => {
    expect((await validateWallet('a'.repeat(111))).error).toBeTruthy();
  });

  test('rejects private keys and keys at the wrong derivation depth', async () => {
    expect((await validateWallet(root.derive("m/84'/0'/0'").privateExtendedKey)).error).toBeTruthy();
    expect((await validateWallet(root.publicExtendedKey)).error).toBeTruthy();
  });

  test('accepts a public account key created by the browser wallet', async () => {
    expect((await validateWallet(keys.btc)).error).toBeUndefined();
  });
});

describe('vault request bounds', () => {
  test('rejects website values that do not fit storage', async () => {
    expect((await checkAPI({website: `https://example.test/${'a'.repeat(2048)}`}, ['website'])).err).toBeTruthy();
  });

  test('rejects draft selectors that could affect several IMAP messages', async () => {
    expect((await checkAPI({draft: '1:*'}, ['?draft'])).err).toBeTruthy();
    expect((await checkAPI({draft: -1}, ['?draft'])).err).toBeTruthy();
    expect((await checkAPI({draft: 7}, ['?draft'])).err).toBeUndefined();
    expect((await checkAPI({draft: null}, ['?draft'])).err).toBeUndefined();
  });
});
