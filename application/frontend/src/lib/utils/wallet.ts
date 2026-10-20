import type {LocalAccount} from 'viem/accounts';
import type {
  BtcSigner,
  Coins,
  PrivKeyType,
  transactionData,
  UTXOData,
  PendingEvmSend,
  FullIdentity,
  WalletAddressAllocation,
  PendingUtxoSend,
} from '$type';
import {request} from '$utils/webfetch';
import {deriveXPub, encrypt, decrypt} from '$utils/cryptography';

function parseCoinAmount(coin: Coins, amount: string | number): bigint {
  const decimals = coin === 'eth' ? 18 : coin === 'usdt' ? 6 : coin === 'xmr' ? 12 : 8;
  const value = String(amount);

  if (!new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`).test(value)) {
    throw new Error(`Use a positive amount with at most ${decimals} decimal places.`);
  }

  const [whole, fraction = ''] = value.split('.');
  const atoms = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0'));

  if (atoms <= 0n) {
    throw new Error('Enter an amount greater than zero.');
  }

  return atoms;
}

export function selectBestUtxos(availableUtxos: UTXOData, amount: number | string, feeRate: number): UTXOData {
  const targetSats = Number(parseCoinAmount('btc', amount));
  const sorted = [...availableUtxos].sort((a, b) => b.value - a.value);

  const selected: UTXOData = [];
  let totalValue = 0;

  for (const utxo of sorted) {
    selected.push(utxo);
    totalValue += utxo.value;

    const currentBytes = 10 + selected.length * 68 + 2 * 31;
    const currentFee = Math.ceil(currentBytes * feeRate);

    if (totalValue >= targetSats + currentFee) {
      return selected;
    }
  }

  return sorted;
}

export function estimateTransactionFee(coin: Coins, inputs: UTXOData, feeRate: number, amount: number | string) {
  if (!amount || Number(amount) <= 0) {
    return {fee: 0, unit: coin === 'usdt' ? 'ETH' : coin.toUpperCase(), size: 0, sizeUnit: ''};
  }

  if (coin === 'btc' || coin === 'ltc') {
    if (!inputs || inputs.length === 0) {
      return {fee: 0, unit: coin.toUpperCase(), size: 0, sizeUnit: 'vBytes'};
    }

    const amountSats = Number(parseCoinAmount(coin, amount));
    const inputTotalSats = inputs.reduce((acc, curr) => acc + curr.value, 0);

    const sizeWithChange = 10 + inputs.length * 68 + 2 * 31;
    const feeWithChange = Math.ceil(sizeWithChange * feeRate);

    const remaining = inputTotalSats - amountSats - feeWithChange;
    const dustLimit = coin === 'btc' ? 546 : 1000;

    let finalSize = sizeWithChange;
    let finalFee = feeWithChange;

    if (remaining < dustLimit) {
      finalSize = 10 + inputs.length * 68 + 1 * 31;
      finalFee = inputTotalSats - amountSats;
    }

    return {
      fee: finalFee / 100_000_000,
      unit: coin.toUpperCase(),
      size: finalSize,
      sizeUnit: 'vBytes',
      feeAtoms: String(finalFee),
    };
  }

  return {fee: 0, unit: '', size: 0, sizeUnit: ''};
}

async function parsePrivKey(key: string, type: PrivKeyType, coin: Coins) {
  const [{privateKeyToAccount, mnemonicToAccount}, btc, bip39, {HDKey}] = await Promise.all([
    import('viem/accounts'),
    import('@scure/btc-signer'),
    import('@scure/bip39'),
    import('@scure/bip32'),
  ]);

  if (['eth', 'usdt'].includes(coin)) {
    if (type === 'mnemonic') {
      return mnemonicToAccount(key);
    } else {
      return privateKeyToAccount(key.startsWith('0x') ? (key as `0x${string}`) : `0x${key}`);
    }
  }

  if (type === 'mnemonic') {
    const seed = await bip39.mnemonicToSeed(key);

    return {type: 'hd', root: HDKey.fromMasterSeed(seed)};
  } else {
    const network = coin === 'btc' ? undefined : {bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0};
    const privKeyBytes = btc.WIF(network).decode(key);

    return {type: 'key', privKey: privKeyBytes};
  }
}

export async function signTransaction(coin: Coins, addr: string, amt: number | string, data: transactionData) {
  if (!addr || addr.length < 10) {
    throw new Error('Enter a valid recipient address.');
  }

  const [
    {createWalletClient, http, parseEther, parseUnits, encodeFunctionData, isAddress, formatUnits},
    btc,
    {HDKey},
    {mainnet},
  ] = await Promise.all([import('viem'), import('@scure/btc-signer'), import('@scure/bip32'), import('viem/chains')]);
  const amountAtoms = parseCoinAmount(coin, amt);

  const broadcastPayload = {coin: coin, hex: '', fee: '', feeUnit: coin === 'usdt' ? 'ETH' : coin.toUpperCase()};

  try {
    if (['btc', 'ltc'].includes(coin)) {
      const isBtc = coin === 'btc';
      const netParam = isBtc ? undefined : ({bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0} as any);

      if (!data.utxos?.length) {
        throw new Error('Select funds before preparing the transaction.');
      }

      if (!/^\d+$/.test(data.feeAtoms ?? '')) {
        throw new Error('A Bitcoin or Litecoin transaction fee is required.');
      }

      const signer = (await parsePrivKey(data.wifKey, data.privKeyType, coin)) as BtcSigner;

      const pathBase = isBtc ? "m/84'/0'/0'" : "m/84'/2'/0'";
      const tx = new btc.Transaction(netParam);

      const outpoints = new Set<string>();

      for (const utxo of data.utxos!) {
        const outpoint = `${utxo.txid}:${utxo.vout}`;

        if (
          !/^[a-f0-9]{64}$/i.test(utxo.txid) ||
          !Number.isSafeInteger(utxo.vout) ||
          utxo.vout < 0 ||
          !Number.isSafeInteger(utxo.value) ||
          utxo.value <= 0 ||
          !Number.isSafeInteger(utxo.pathIndex) ||
          utxo.pathIndex < 0 ||
          utxo.pathIndex >= 2 ** 31 ||
          (utxo.branch !== 0 && utxo.branch !== 1) ||
          outpoints.has(outpoint)
        ) {
          throw new Error('Selected outputs contain invalid values or duplicate inputs.');
        }

        outpoints.add(outpoint);
        let publicKey: Uint8Array;

        if (signer.type === 'hd') {
          const child = signer.root.derive(`${pathBase}/${utxo.branch}/${utxo.pathIndex}`);
          publicKey = child.publicKey!;
        } else {
          publicKey = new HDKey({privateKey: signer.privKey, chainCode: new Uint8Array(32)}).publicKey!;
        }

        const p2wpkh = btc.p2wpkh(publicKey, netParam);
        const p2sh = btc.p2sh(p2wpkh, netParam);
        const p2pkh = btc.p2pkh(publicKey, netParam);

        if (![p2wpkh.address, p2sh.address, p2pkh.address].includes(utxo.address)) {
          throw new Error('A selected input does not belong to this signing key.');
        }

        let script = p2wpkh.script;

        if (utxo.address === p2sh.address) {
          script = p2sh.script;
        } else {
          if (utxo.address === p2pkh.address) {
            script = p2pkh.script;
          }
        }

        if (utxo.address === p2pkh.address) {
          if (!utxo.rawTx) {
            throw new Error('The previous transaction is required to sign a legacy Bitcoin input.');
          }

          tx.addInput({txid: utxo.txid, index: utxo.vout, nonWitnessUtxo: utxo.rawTx});
          continue;
        }

        tx.addInput({
          txid: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: script,
            amount: BigInt(utxo.value),
          },
          ...(utxo.address === p2sh.address ? {redeemScript: p2wpkh.script} : {}),
        });
      }

      const amountSats = amountAtoms;
      tx.addOutputAddress(addr, amountSats, netParam);

      const inputTotal = data.utxos!.reduce((acc, u) => acc + BigInt(u.value), BigInt(0n));
      const feeSats = BigInt(data.feeAtoms!);

      if (feeSats <= 0n) {
        throw new Error('The network fee must be greater than zero.');
      }

      const change = inputTotal - amountSats - feeSats;

      if (inputTotal < amountSats + feeSats) {
        throw new Error('Selected funds do not cover the amount and network fee.');
      }

      if (change >= BigInt(isBtc ? 546 : 1000)) {
        let returnAddress;

        if (signer.type === 'hd') {
          const path = data.changePath;

          if (
            !path ||
            (path.branch !== 0 && path.branch !== 1) ||
            !Number.isSafeInteger(path.index) ||
            path.index < 0 ||
            path.index >= 2 ** 31
          ) {
            throw new Error('An owned change address is required. Prepare the transaction again.');
          }

          const child = signer.root.derive(`${pathBase}/${path.branch}/${path.index}`);
          returnAddress = btc.p2wpkh(child.publicKey!, netParam).address;
        } else {
          const pubKey = new HDKey({
            privateKey: (signer as any).privKey,
            chainCode: new Uint8Array(32),
          }).publicKey!;

          returnAddress = btc.p2wpkh(pubKey, netParam).address;
        }

        tx.addOutputAddress(returnAddress!, change, netParam);
      }

      for (let i = 0; i < data.utxos!.length; i++) {
        const utxo = data.utxos![i];
        let privateKey: Uint8Array;

        if (signer.type === 'hd') {
          privateKey = signer.root.derive(`${pathBase}/${utxo.branch}/${utxo.pathIndex}`).privateKey!;
        } else {
          privateKey = signer.privKey;
        }

        tx.signIdx(privateKey, i);
      }

      const expectedFee = change >= BigInt(isBtc ? 546 : 1000) ? feeSats : inputTotal - amountSats;

      if (tx.fee !== expectedFee) {
        throw new Error('The signed inputs do not match the reviewed network fee.');
      }

      tx.finalize();
      broadcastPayload.hex = tx.hex;
      broadcastPayload.fee = formatUnits(change >= BigInt(isBtc ? 546 : 1000) ? feeSats : inputTotal - amountSats, 8);
    }

    if (['eth', 'usdt'].includes(coin)) {
      if (!isAddress(addr)) {
        throw new Error('Enter a valid Ethereum address.');
      }

      const account = (await parsePrivKey(data.wifKey, data.privKeyType, coin)) as LocalAccount;

      if (account.address.toLowerCase() !== data.senderAddress?.toLowerCase()) {
        throw new Error('The signing key does not match the prepared source address.');
      }

      if (
        !Number.isSafeInteger(data.nonce) ||
        data.nonce! < 0 ||
        !/^\d+$/.test(data.balanceAtoms ?? '') ||
        !/^\d+$/.test(data.gasBalanceAtoms ?? '')
      ) {
        throw new Error('Fresh pending nonce and balances are required. Prepare the transaction again.');
      }

      const client = createWalletClient({account, chain: mainnet, transport: http()});

      if (
        [data.gasLimit, data.maxFeePerGas, data.maxPriorityFeePerGas].some(
          (value) => !/^\d+$/.test(value ?? '') || BigInt(value!) <= 0n,
        )
      ) {
        throw new Error('A current gas estimate and fee caps are required. Prepare the transaction again.');
      }

      const gas = BigInt(data.gasLimit!);
      const maxFeePerGas = BigInt(data.maxFeePerGas!);
      const maxPriorityFeePerGas = BigInt(data.maxPriorityFeePerGas!);

      if (maxPriorityFeePerGas > maxFeePerGas || gas > 36_000_000n) {
        throw new Error('The prepared gas estimate is invalid. Prepare the transaction again.');
      }

      const ethBalanceWei = BigInt(data.balanceAtoms!);
      const feeWei = maxFeePerGas * gas;

      let serializedRequest;

      if (coin === 'usdt') {
        const tokenBalance = BigInt(data.balanceAtoms!);
        const gasBalance = BigInt(data.gasBalanceAtoms!);

        if (gasBalance < feeWei) {
          throw new Error('The source wallet needs enough ETH to pay the USDT network fee.');
        }

        const amountToken = parseUnits(String(amt), 6);

        const usdtABI = [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              {name: 'recipient', type: 'address'},
              {name: 'amount', type: 'uint256'},
            ],
            outputs: [{type: 'bool'}],
          },
        ];

        if (tokenBalance < amountToken) {
          throw new Error('The USDT balance does not cover this amount.');
        }

        const fdata = encodeFunctionData({
          abi: usdtABI,
          functionName: 'transfer',
          args: [addr, parseUnits(String(amt), 6)],
        });

        serializedRequest = await client.signTransaction({
          to: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          data: fdata,
          value: BigInt(0n),
          nonce: data.nonce,
          maxFeePerGas,
          maxPriorityFeePerGas,
          gas,
        });
      } else {
        const amountWei = parseEther(String(amt));

        if (ethBalanceWei < amountWei + feeWei) {
          throw new Error('The ETH balance does not cover this amount and fee.');
        }

        serializedRequest = await client.signTransaction({
          to: addr,
          value: parseEther(String(amt)),
          nonce: data.nonce,
          maxFeePerGas,
          maxPriorityFeePerGas,
          gas,
        });
      }

      broadcastPayload.hex = serializedRequest;
      broadcastPayload.fee = formatUnits(feeWei, 18);
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('The transaction could not be signed.');
  }

  return broadcastPayload;
}

export async function acquireEvmSend(address: string): Promise<() => void> {
  return acquireWalletSend(`evm:${address.toLowerCase()}`, 'ETH or USDT');
}

async function acquireWalletSend(scope: string, asset: string): Promise<() => void> {
  if (!navigator.locks) {
    throw new Error('This browser cannot coordinate wallet sends across tabs. Use a browser with Web Locks support.');
  }

  let acquired!: () => void;
  let denied!: (error: Error) => void;
  let release!: () => void;
  const ready = new Promise<void>((resolve, reject) => {
    acquired = resolve;
    denied = reject;
  });
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });

  void navigator.locks
    .request(`wallet-send:${scope}`, {ifAvailable: true}, async (lock) => {
      if (!lock) {
        denied(new Error(`Another tab is preparing or submitting a ${asset} transaction. Finish that payment first.`));
        return;
      }

      acquired();
      await held;
    })
    .catch((cause) => denied(cause instanceof Error ? cause : new Error('Wallet coordination failed.')));

  await ready;

  return release;
}

export function pendingEvmSend(address: string, storage: Storage = localStorage): PendingEvmSend | null {
  const value = storage.getItem(`wallet-pending:${address.toLowerCase()}`);

  if (value === null) {
    return null;
  }

  const pending = JSON.parse(value) as PendingEvmSend;

  if (
    !Number.isSafeInteger(pending.nonce) ||
    pending.nonce < 0 ||
    !/^0x[a-f0-9]+$/i.test(pending.hex) ||
    !/^0x[a-f0-9]{64}$/i.test(pending.txid) ||
    (pending.coin !== 'eth' && pending.coin !== 'usdt')
  ) {
    throw new Error('The saved broadcast reference is invalid. Check transaction history before sending again.');
  }

  return pending;
}

export function checkPendingEvmSend(address: string, nonce: number, storage: Storage = localStorage) {
  const pending = pendingEvmSend(address, storage);

  if (!pending) {
    return;
  }

  if (!Number.isSafeInteger(nonce) || nonce <= pending.nonce) {
    throw new Error(
      'A previous broadcast is unresolved. Look it up or retry the same signed transaction before preparing another send.',
    );
  }

  clearPendingEvmSend(address, pending.txid, storage);
}

export function clearPendingEvmSend(address: string, txid: string, storage: Storage = localStorage) {
  const pending = pendingEvmSend(address, storage);

  if (pending?.txid === txid) {
    storage.removeItem(`wallet-pending:${address.toLowerCase()}`);
  }
}

export function recordPendingEvmSend(address: string, pending: PendingEvmSend, storage: Storage = localStorage) {
  if (!Number.isSafeInteger(pending.nonce) || pending.nonce < 0) {
    throw new Error('A valid pending nonce is required. Prepare the transaction again.');
  }

  storage.setItem(`wallet-pending:${address.toLowerCase()}`, JSON.stringify(pending));
}

export async function reserveWalletAddress(
  account: FullIdentity,
  coin: 'btc' | 'ltc',
  branch: 0 | 1,
  requestID: string,
) {
  const result = await request<WalletAddressAllocation>(`/identities/${account.id}/wallet/addresses`, 'POST', {
    coin,
    branch,
    requestID,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  const allocation = result.data;

  if (
    allocation.coin !== coin ||
    allocation.branch !== branch ||
    !Number.isSafeInteger(allocation.index) ||
    allocation.index < 0 ||
    allocation.index >= 2 ** 31 ||
    allocation.address !== deriveXPub(coin, account.walletKeys[coin], allocation.index, branch)
  ) {
    throw new Error('The allocated address does not belong to this wallet.');
  }

  return allocation;
}

export async function verifyWalletInputs(id: string, coin: 'btc' | 'ltc', utxos: UTXOData) {
  const result = await request(`/identities/${id}/wallet/utxos/verify`, 'POST', {coin, utxos});

  if (!result.ok) {
    throw new Error(result.error);
  }
}

export async function acquireUtxoSend(coin: 'btc' | 'ltc') {
  return acquireWalletSend(`utxo:${coin}`, coin.toUpperCase());
}

export async function utxoJournalKey(mnemonic: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`ShadowSelf signed transaction journal\0${mnemonic}`),
  );

  return crypto.subtle.importKey('raw', digest, {name: 'AES-GCM'}, false, ['encrypt', 'decrypt']);
}

export async function utxoJournalScope(account: FullIdentity, coin: 'btc' | 'ltc') {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(account.walletKeys[coin]));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');

  return `wallet-pending-utxo:${coin}:${fingerprint}`;
}

export async function inspectUtxoSend(
  coin: 'btc' | 'ltc',
  hex: string,
  review: PendingUtxoSend['review'],
): Promise<PendingUtxoSend> {
  const {Transaction} = await import('@scure/btc-signer');

  if (typeof hex !== 'string' || hex.length > 1_000_000 || !/^(?:[a-f0-9]{2})+$/i.test(hex)) {
    throw new Error('The saved transaction bytes are invalid.');
  }

  const transaction = Transaction.fromRaw(Uint8Array.from(Buffer.from(hex, 'hex')));

  if (
    !transaction.isFinal ||
    !transaction.inputsLength ||
    transaction.inputsLength > 500 ||
    !transaction.outputsLength
  ) {
    throw new Error('The saved transaction is not complete.');
  }

  const inputs = Array.from({length: transaction.inputsLength}, (_, index) => {
    const input = transaction.getInput(index);

    if (!input.txid || input.index === undefined) {
      throw new Error('The saved transaction inputs are invalid.');
    }

    return {txid: Buffer.from(input.txid).toString('hex'), vout: input.index};
  });

  return {coin, txid: transaction.id, hex, inputs, review};
}

export async function pendingUtxoSend(
  scope: string,
  coin: 'btc' | 'ltc',
  key: CryptoKey,
  storage: Storage = localStorage,
): Promise<PendingUtxoSend | null> {
  const value = storage.getItem(scope);

  if (value === null) {
    return null;
  }

  const envelope = JSON.parse(value);
  const plaintext = await decrypt(envelope.sealed, key);

  if (!plaintext) {
    throw new Error('The saved payment cannot be unlocked. Keep this browser data until it can be recovered.');
  }

  const pending = JSON.parse(plaintext) as PendingUtxoSend;
  const inspected = await inspectUtxoSend(coin, pending.hex, pending.review);

  if (
    pending.coin !== coin ||
    pending.txid !== inspected.txid ||
    envelope.txid !== inspected.txid ||
    JSON.stringify(envelope.inputs) !== JSON.stringify(inspected.inputs) ||
    JSON.stringify(pending.inputs) !== JSON.stringify(inspected.inputs)
  ) {
    throw new Error('The saved payment does not match its transaction reference.');
  }

  return inspected;
}

export function checkPendingUtxoInputs(
  scope: string,
  coin: 'btc' | 'ltc',
  inputs: UTXOData,
  storage: Storage = localStorage,
) {
  for (let index = 0; index < storage.length; index++) {
    const name = storage.key(index)!;

    if (!name.startsWith(`wallet-pending-utxo:${coin}:`)) {
      continue;
    }

    const entry = JSON.parse(storage.getItem(name)!);

    if (!Array.isArray(entry.inputs)) {
      throw new Error('A saved payment needs recovery before another send.');
    }

    if (
      name === scope ||
      entry.inputs.some((pending: {txid: string; vout: number}) =>
        inputs.some((input) => input.txid === pending.txid && input.vout === pending.vout),
      )
    ) {
      throw new Error(
        'A previous payment is unresolved. Open its original wallet and look up or retry that payment first.',
      );
    }
  }
}

export async function recordPendingUtxoSend(
  scope: string,
  pending: PendingUtxoSend,
  key: CryptoKey,
  storage: Storage = localStorage,
) {
  const existing = await pendingUtxoSend(scope, pending.coin, key, storage);

  if (existing && existing.txid !== pending.txid) {
    throw new Error('A previous payment needs recovery before another send.');
  }

  const sealed = await encrypt(JSON.stringify(pending), key);
  const value = JSON.stringify({txid: pending.txid, inputs: pending.inputs, sealed});
  storage.setItem(scope, value);

  if (storage.getItem(scope) !== value) {
    throw new Error('The signed payment could not be saved. Nothing was broadcast.');
  }
}

export async function clearPendingUtxoSend(
  scope: string,
  pending: PendingUtxoSend,
  key: CryptoKey,
  storage: Storage = localStorage,
) {
  const current = await pendingUtxoSend(scope, pending.coin, key, storage);

  if (current?.txid === pending.txid) {
    storage.removeItem(scope);
  }
}
