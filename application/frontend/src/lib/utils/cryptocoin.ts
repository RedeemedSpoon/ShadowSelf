import type {APIResponse, Coins, Priority, UTXOData} from '$type';
import {decrypt, deriveXPub} from './cryptography';
import {get} from 'svelte/store';
import {identity} from '$store';
import {notify} from '$lib';

import {createWalletClient, http, parseEther, parseUnits, encodeFunctionData, isAddress} from 'viem';
import {mnemonicToAccount} from 'viem/accounts';
import * as btc from '@scure/btc-signer';
import * as bip39 from '@scure/bip39';
import {mainnet} from 'viem/chains';
import {HDKey} from '@scure/bip32';

// --- MAGIC NUMBERS (WEIGHTS) ---
const VBYTE_INPUT = 68;
const VBYTE_OUTPUT = 31;
const VBYTE_OVERHEAD = 10;

const GAS_ETH_TRANSFER = 21_000;
const GAS_ERC20_TRANSFER = 65_000;

export function selectBestUtxos(availableUtxos: UTXOData, amount: number, feeRate: number): UTXOData {
  const targetSats = Math.floor(amount * 100_000_000);
  const sorted = [...availableUtxos].sort((a, b) => b.value - a.value);

  const selected: UTXOData = [];
  let totalValue = 0;

  for (const utxo of sorted) {
    selected.push(utxo);
    totalValue += utxo.value;

    const currentBytes = VBYTE_OVERHEAD + selected.length * VBYTE_INPUT + 2 * VBYTE_OUTPUT;
    const currentFee = Math.ceil(currentBytes * feeRate);

    if (totalValue >= targetSats + currentFee) {
      return selected;
    }
  }

  return sorted;
}

export function estimateTransactionFee(coin: Coins, inputs: UTXOData, feeRate: number, amount: number) {
  if (!amount || amount <= 0) {
    return {fee: 0, unit: coin === 'usdt' ? 'ETH' : coin.toUpperCase(), size: 0, sizeUnit: ''};
  }

  if (coin === 'eth' || coin === 'usdt') {
    const gasLimit = coin === 'eth' ? GAS_ETH_TRANSFER : GAS_ERC20_TRANSFER;
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

    const amountSats = Math.floor(amount * 100_000_000);
    const inputTotalSats = inputs.reduce((acc, curr) => acc + curr.value, 0);

    const sizeWithChange = VBYTE_OVERHEAD + inputs.length * VBYTE_INPUT + 2 * VBYTE_OUTPUT;
    const feeWithChange = Math.ceil(sizeWithChange * feeRate);

    const remaining = inputTotalSats - amountSats - feeWithChange;
    const dustLimit = coin === 'btc' ? 546 : 1000;

    let finalSize = sizeWithChange;
    let finalFee = feeWithChange;

    if (remaining < dustLimit) {
      finalSize = VBYTE_OVERHEAD + inputs.length * VBYTE_INPUT + 1 * VBYTE_OUTPUT;
      finalFee = Math.ceil(finalSize * feeRate);
    }

    return {
      fee: finalFee / 100_000_000,
      unit: coin.toUpperCase(),
      size: finalSize,
      sizeUnit: 'vBytes',
    };
  }

  return {fee: 0, unit: '', size: 0, sizeUnit: ''};
}

export async function signTransaction(
  coin: Coins,
  addr: string,
  amt: number,
  priority: Priority,
  utxos: UTXOData,
  estimatedFee: any,
  crypto: APIResponse,
) {
  if (!addr || addr.length < 10) return notify('Invalid Receiver Address', 'alert');
  if (amt <= 0) return notify('Amount must be greater than 0', 'alert');

  let broadcastPayload = {coin: coin, hex: ''};
  const mnemonicCode = await decrypt(get(identity).wallet_blob);

  try {
    if (['btc', 'ltc'].includes(coin)) {
      const isBtc = coin === 'btc';
      const netParam = isBtc ? undefined : ({bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0} as any);

      const seed = await bip39.mnemonicToSeed(mnemonicCode);
      const root = HDKey.fromMasterSeed(seed);

      const pathBase = isBtc ? "m/84'/0'/0'/0" : "m/84'/2'/0'/0";
      const tx = new btc.Transaction(netParam);

      for (const utxo of utxos) {
        const child = root.derive(`${pathBase}/${utxo.path_index}`);

        tx.addInput({
          txid: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: btc.p2wpkh(child.publicKey!, netParam).script,
            amount: BigInt(utxo.value),
          },
        });
      }

      const amountSats = BigInt(Math.floor(amt * 100_000_000));
      tx.addOutputAddress(addr, amountSats, netParam);

      const inputTotal = utxos.reduce((acc, u) => acc + BigInt(u.value), 0n);
      const feeSats = BigInt(Math.ceil(estimatedFee.fee * 100_000_000));
      const change = inputTotal - amountSats - feeSats;

      if (inputTotal < amountSats + feeSats) {
        return notify(`Insufficient selected funds. Need ${(Number(amountSats + feeSats) / 1e8).toFixed(6)}`, 'alert');
      }

      if (change > 546n) {
        const lastUsedIndex = Math.max(0, crypto.wallet[coin as 'btc'].next_index - 1);
        const returnAddress = deriveXPub(coin, get(identity).wallet_keys[coin as 'btc'], lastUsedIndex);
        tx.addOutputAddress(returnAddress, change, netParam);
      }

      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i];
        const child = root.derive(`${pathBase}/${utxo.path_index}`);
        tx.signIdx(child.privateKey!, i);
      }

      tx.finalize();
      broadcastPayload.hex = tx.hex;
    }

    if (['eth', 'usdt'].includes(coin)) {
      if (!isAddress(addr)) return notify('Invalid Ethereum Address', 'alert');

      const wallet = crypto.wallet[coin as 'eth'];

      const account = mnemonicToAccount(mnemonicCode);
      const client = createWalletClient({account, chain: mainnet, transport: http()});
      const gasPrice = parseUnits(crypto.fees[coin][priority].toString(), 9);

      const ethBalanceWei = parseEther(String(crypto.wallet['eth'].balance));
      const feeWei = gasPrice * (coin === 'usdt' ? BigInt(65000) : BigInt(21000));

      let serializedRequest;

      if (coin === 'usdt') {
        const tokenBalance = parseUnits(String(crypto.wallet['usdt'].balance), 6);
        const amountToken = parseUnits(String(amt), 6);

        if (tokenBalance < amountToken) return notify('Insufficient USDT Balance', 'alert');
        if (ethBalanceWei < feeWei) return notify('Insufficient ETH for Gas', 'alert');

        const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
        const ERC20_ABI = [
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

        const data = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [addr, parseUnits(String(amt), 6)],
        });

        serializedRequest = await client.signTransaction({
          to: USDT_CONTRACT,
          data,
          value: 0n,
          nonce: wallet.nonce,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice,
          gas: 65000n,
        });
      } else {
        const amountWei = parseEther(String(amt));
        if (ethBalanceWei < amountWei + feeWei) return notify('Insufficient ETH Balance', 'alert');

        serializedRequest = await client.signTransaction({
          to: addr,
          value: parseEther(String(amt)),
          nonce: wallet.nonce,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice,
          gas: 21000n,
        });
      }

      broadcastPayload.hex = serializedRequest;
    }
  } catch (error) {
    if (error instanceof Error) return notify(error.message, 'alert');
    else return notify(error as unknown as string, 'alert');
  }

  return broadcastPayload;
}
