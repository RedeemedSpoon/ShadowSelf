import {describe, expect, test} from 'bun:test';
import {privateKeyToAccount} from 'viem/accounts';
import {parseTransaction} from 'viem';
import {HDKey} from '@scure/bip32';
import {selectBestUtxos, estimateTransactionFee, signTransaction, acquireEvmSend, checkPendingEvmSend, recordPendingEvmSend} from '../src/lib/utils/wallet';
import {deriveXPub} from '../src/lib/utils/cryptography';
import type {transactionData} from '../src/lib/types';

const privateKey = '1'.repeat(64);
const sender = privateKeyToAccount(`0x${privateKey}`).address;
const destination = '0x' + '2'.repeat(40);

function memoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  } as Storage;
}

function evmData(overrides: Partial<transactionData> = {}): transactionData {
  return {
    senderAddress: sender,
    gasPriceAtoms: '1000000000',
    wifKey: privateKey,
    privKeyType: 'hex',
    estimatedFee: 1,
    nonce: 7,
    balanceAtoms: '1000000000000000000',
    gasBalanceAtoms: '1000000000000000000',
    ...overrides,
  };
}

describe('wallet signing boundaries', () => {
  test('signs the exact reviewed decimal amount with the supplied pending nonce', async () => {
    const signed = await signTransaction('eth', destination, '0.123456789012345678', evmData());
    const transaction = parseTransaction(signed.hex as `0x${string}`);

    expect(transaction.value).toBe(123456789012345678n);
    expect(transaction.nonce).toBe(7);
    expect(signed.fee).toBe('0.000021');
  });

  test('signs very small gas rates as exact wei rather than scientific notation', async () => {
    const signed = await signTransaction('eth', destination, '0.1', evmData({estimatedFee: 0.000000001, gasPriceAtoms: '1'}));
    const transaction = parseTransaction(signed.hex as `0x${string}`);

    expect(transaction.maxFeePerGas).toBe(1n);
    expect(signed.fee).toBe('0.000000000000021');
  });

  test('rejects excess precision, unsafe nonce, insufficient fees, and a mismatched signer', async () => {
    await expect(signTransaction('eth', destination, '0.0000000000000000001', evmData())).rejects.toThrow('decimal places');
    await expect(signTransaction('eth', destination, '0.1', evmData({nonce: undefined}))).rejects.toThrow('Fresh pending');
    await expect(signTransaction('eth', destination, '1', evmData())).rejects.toThrow('balance does not cover');
    await expect(signTransaction('eth', destination, '0.1', evmData({senderAddress: destination}))).rejects.toThrow('signing key');
    await expect(signTransaction('usdt', destination, '1', evmData({balanceAtoms: '1000000', gasBalanceAtoms: '0'}))).rejects.toThrow('needs enough ETH');
  });

  test('selects inputs and estimates fees without rounding a decimal amount', () => {
    const inputs = [{txid: 'a'.repeat(64), vout: 0, value: 100_000, address: 'fixture', pathIndex: 0}];
    const selected = selectBestUtxos(inputs, '0.00098765', 1);
    const fee = estimateTransactionFee('btc', selected, 1, '0.00098765');

    expect(selected).toHaveLength(1);
    expect(fee.feeAtoms).toBe('140');
    expect(() => selectBestUtxos(inputs, '1e-8', 1)).toThrow('decimal places');
  });

  test('rejects a newly generated change address outside normal discovery', async () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const {mnemonicToSeed} = await import('@scure/bip39');
    const key = HDKey.fromMasterSeed(await mnemonicToSeed(mnemonic)).derive("m/84'/0'/0'").publicExtendedKey;
    const address = deriveXPub('btc', key, 0);
    const data: transactionData = {
      wifKey: mnemonic,
      privKeyType: 'mnemonic',
      xpubKey: key,
      index: 120,
      estimatedFee: {fee: 0.00001, feeAtoms: '1000'},
      utxos: [{txid: 'a'.repeat(64), vout: 0, value: 200_000, address, pathIndex: 0}],
    };

    await expect(signTransaction('btc', address, '0.001', data)).rejects.toThrow('supported range');
    const signed = await signTransaction('btc', address, '0.001', {...data, index: undefined});

    expect(signed.hex.length).toBeGreaterThan(100);
    expect(signed.fee).toBe('0.00001');
  });
});

describe('pending EVM send coordination', () => {
  test('blocks another send until the provider acknowledges the recorded nonce', () => {
    const storage = memoryStorage();
    recordPendingEvmSend(sender, 7, storage);

    expect(() => checkPendingEvmSend(sender.toLowerCase(), 7, storage)).toThrow('still unconfirmed');
    expect(() => checkPendingEvmSend(sender, 6, storage)).toThrow('still unconfirmed');
    checkPendingEvmSend(sender, 8, storage);
    expect(storage.getItem(`wallet-pending:${sender.toLowerCase()}`)).toBeNull();
  });

  test('fails closed on corrupt pending state and invalid nonce', () => {
    const storage = memoryStorage();
    storage.setItem(`wallet-pending:${sender.toLowerCase()}`, 'invalid');

    expect(() => checkPendingEvmSend(sender, 8, storage)).toThrow('still unconfirmed');
    expect(() => recordPendingEvmSend(sender, -1, storage)).toThrow('valid pending nonce');
  });

  test('shares one exclusive Web Lock between ETH and USDT sends', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const held = new Set<string>();
    const locks = {
      request: async (name: string, _options: unknown, operation: (lock: object | null) => Promise<void>) => {
        if (held.has(name)) {
          await operation(null);
          return;
        }

        held.add(name);

        try {
          await operation({});
        } finally {
          held.delete(name);
        }
      },
    };
    Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {locks}});

    try {
      const release = await acquireEvmSend(sender);
      await expect(acquireEvmSend(sender.toLowerCase())).rejects.toThrow('Another tab');
      release();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const releaseNext = await acquireEvmSend(sender);
      releaseNext();
    } finally {
      if (original) {
        Object.defineProperty(globalThis, 'navigator', original);
      } else {
        Reflect.deleteProperty(globalThis, 'navigator');
      }
    }
  });
});
