import {createWalletClient, http, parseEther, parseUnits, encodeFunctionData, isAddress, formatUnits} from 'viem';
import {privateKeyToAccount, mnemonicToAccount, type LocalAccount} from 'viem/accounts';
import type {BtcSigner, Coins, PrivKeyType, transactionData, UTXOData} from '$type';
import {deriveXPub} from '$utils/cryptography';

import * as btc from '@scure/btc-signer';
import * as bip39 from '@scure/bip39';
import {mainnet} from 'viem/chains';
import {HDKey} from '@scure/bip32';

function parseCoinAmount(coin: Coins, amount: string | number): bigint {
  const decimals = coin === 'eth' ? 18 : coin === 'usdt' ? 6 : coin === 'xmr' ? 12 : 8;
  const value = String(amount);

  if (!new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`).test(value)) {
    throw new Error(`Use a positive amount with at most ${decimals} decimal places.`);
  }

  const atoms = parseUnits(value, decimals);

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

  if (coin === 'eth' || coin === 'usdt') {
    const gasLimit = coin === 'eth' ? 21_000 : 65_000;
    const feeInEth = (gasLimit * feeRate) / 1_000_000_000;

    return {
      fee: feeInEth,
      unit: 'ETH',
      size: gasLimit,
      sizeUnit: 'Gas',
    };
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

  const amountAtoms = parseCoinAmount(coin, amt);

  const broadcastPayload = {coin: coin, hex: '', fee: '', feeUnit: coin === 'usdt' ? 'ETH' : coin.toUpperCase()};

  try {
    if (['btc', 'ltc'].includes(coin)) {
      const isBtc = coin === 'btc';
      const netParam = isBtc ? undefined : ({bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0} as any);

      if (!data.utxos?.length) {
        throw new Error('Select funds before preparing the transaction.');
      }

      if (typeof data.estimatedFee === 'number') {
        throw new Error('A Bitcoin or Litecoin transaction fee is required.');
      }

      const signer = (await parsePrivKey(data.wifKey, data.privKeyType, coin)) as BtcSigner;

      const pathBase = isBtc ? "m/84'/0'/0'/0" : "m/84'/2'/0'/0";
      const tx = new btc.Transaction(netParam);

      for (const utxo of data.utxos!) {
        let publicKey: Uint8Array;

        if (signer.type === 'hd') {
          const child = signer.root.derive(`${pathBase}/${utxo.pathIndex}`);
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
      const feeSats = data.estimatedFee.feeAtoms !== undefined ? BigInt(data.estimatedFee.feeAtoms) : BigInt(Math.round(data.estimatedFee.fee * 100_000_000));

      if (feeSats <= 0n) {
        throw new Error('The network fee must be greater than zero.');
      }

      const change = inputTotal - amountSats - feeSats;

      if (inputTotal < amountSats + feeSats) {
        throw new Error('Selected funds do not cover the amount and network fee.');
      }

      if (change >= BigInt(isBtc ? 546 : 1000)) {
        let returnAddress;

        if (data.privKeyType === 'mnemonic') {
          returnAddress = deriveXPub(coin, data.xpubKey!, data.index!);
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
          privateKey = signer.root.derive(`${pathBase}/${utxo.pathIndex}`).privateKey!;
        } else {
          privateKey = signer.privKey;
        }

        tx.signIdx(privateKey, i);
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

      const client = createWalletClient({account, chain: mainnet, transport: http()});

      if (typeof data.estimatedFee !== 'number' || !Number.isFinite(data.estimatedFee) || data.estimatedFee <= 0) {
        throw new Error('A valid gas fee is required.');
      }

      const gasPrice = parseUnits(data.estimatedFee.toString(), 9);

      const ethBalanceWei = data.balanceAtoms !== undefined ? BigInt(data.balanceAtoms) : parseEther(String(data.gasBalance ?? data.balance));
      const feeWei = gasPrice * (coin === 'usdt' ? BigInt(65000) : BigInt(21000));

      let serializedRequest;

      if (coin === 'usdt') {
        const tokenBalance = data.balanceAtoms !== undefined ? BigInt(data.balanceAtoms) : parseUnits(String(data.balance), 6);
        const gasBalance = data.gasBalanceAtoms !== undefined ? BigInt(data.gasBalanceAtoms) : parseEther(String(data.gasBalance || 0));

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
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice,
          gas: BigInt(65000n),
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
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice,
          gas: BigInt(21000n),
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
