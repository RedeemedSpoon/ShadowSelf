<script lang="ts">
  import type {CryptoAPI, Coins, transactionData} from '$type';
  import {QrScanner, LoadingButton} from '$component';
  import {signTransaction} from '$cryptocoin';
  import type {Writable} from 'svelte/store';
  import {deriveXPub} from '$cryptography';
  import {identity} from '$store';
  import {fetchAPI} from '$fetch';
  import {notify} from '$lib';

  import {privateKeyToAccount} from 'viem/accounts';
  import * as btc from '@scure/btc-signer';
  import {HDKey} from '@scure/bip32';

  interface Props {
    currentCrypto: Writable<Coins>;
    crypto: CryptoAPI;
  }

  let {currentCrypto, crypto}: Props = $props();

  let scanning = $state(false);
  let sweepStepMessage: string = $state('');

  async function sweepWallet(result: string) {
    scanning = false;
    const coin = $currentCrypto;
    let addresses: string[] = [];

    sweepStepMessage = 'Decrypting Private Key...';
    await new Promise((r) => setTimeout(r, Math.random() * 400 + 400));

    sweepStepMessage = 'Deriving Address Formats...';
    await new Promise((r) => setTimeout(r, Math.random() * 300 + 200));

    if (['btc', 'ltc'].includes(coin)) {
      const net = coin === 'btc' ? undefined : ({bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0} as any);
      const privKeyBytes = btc.WIF(net).decode(result);
      const pub = new HDKey({privateKey: privKeyBytes, chainCode: new Uint8Array(32)}).publicKey!;
      addresses = [btc.p2wpkh(pub, net).address!, btc.p2sh(btc.p2wpkh(pub, net), net).address!, btc.p2pkh(pub, net).address!];
    } else {
      addresses = [privateKeyToAccount((result.startsWith('0x') ? result : `0x${result}`) as `0x${string}`).address];
    }

    sweepStepMessage = 'Scanning Blockchain Nodes...';
    await new Promise((r) => setTimeout(r, Math.random() * 600 + 300));

    const info = await fetchAPI<CryptoAPI>('crypto/sweep-info', 'POST', {coin, addresses});
    if (info.err || Number(info.balance) === 0) return notify('Wallet Empty or Invalid', 'alert');

    sweepStepMessage = 'Calculating Network Fees...';
    await new Promise((r) => setTimeout(r, Math.random() * 200 + 400));

    let amt = 0;
    let feeParam: any = 0;

    if (['btc', 'ltc'].includes(coin)) {
      const vBytes = info.utxos!.length * 68 + 31 + 10;
      const feeBtc = (vBytes * crypto.fees[coin].medium) / 100_000_000;
      amt = info.balance! / 100_000_000 - feeBtc;
      feeParam = {fee: feeBtc};
    } else {
      const gasPriceGwei = crypto.fees[coin].medium;
      feeParam = gasPriceGwei;

      if (coin === 'usdt') {
        amt = Number(info.balance) / 1_000_000;
      } else {
        const gasLimit = 21000;
        const feeEth = (gasLimit * gasPriceGwei) / 1_000_000_000;
        amt = Number(info.balance) / 1e18 - feeEth;
      }
    }

    sweepStepMessage = 'Cryptographically Signing...';
    await new Promise((r) => setTimeout(r, Math.random() * 600 + 500));

    const destAddr = ['btc', 'ltc'].includes(coin)
      ? deriveXPub(coin, $identity.walletKeys[coin as 'btc'], Math.max(0, crypto.wallet[coin as 'btc'].nextIndex))
      : $identity.walletKeys.evm;

    const data: transactionData = {
      estimatedFee: feeParam,
      privKeyType: ['btc', 'ltc'].includes(coin) ? 'wif' : 'hex',
      wifKey: result,
      utxos: info.utxos?.map((u: any) => ({...u, pathIndex: 0})),
      nonce: info.nonce,
      balance: info.balance,
    };

    const payload = await signTransaction(coin, destAddr, amt, data);

    sweepStepMessage = 'Broadcasting to Network...';
    await new Promise((r) => setTimeout(r, Math.random() * 600 + 800));

    const response = await fetchAPI<CryptoAPI>('crypto/broadcast', 'POST', payload!);
    notify(response.err || `Swept ${amt.toFixed(6)} ${coin.toUpperCase()}`, response.type);
    sweepStepMessage = '';
  }
</script>

<div class="flex h-[40vh] items-center justify-center">
  <div class="flex w-2/3 flex-col items-center gap-3 md:w-1/2">
    <h3>Sweep {$currentCrypto.toUpperCase()} Wallet</h3>
    <p class="mb-4 text-center text-base leading-relaxed text-neutral-400">
      Sweeping imports funds from a paper wallet or private key directly into your ShadowSelf vault. We calculate the maximum
      transferable amount (minus network miner fees) and broadcast a transaction to move 100% of the assets to your main address. Your
      private key is processed locally and never leaves your browser.
    </p>
    <div>
      <LoadingButton type="button" onclick={() => (scanning = true)}>Scan Paper Wallet</LoadingButton>
      <h5 class="text-center font-mono text-sm text-neutral-500">{sweepStepMessage}</h5>
    </div>
  </div>
  {#if scanning}
    <QrScanner sweepWallet={true} onScan={sweepWallet} close={() => (scanning = false)} />
  {/if}
</div>

<style lang="postcss">
  @reference "$style";

  h3 {
    @apply text-3xl font-bold text-neutral-300;
  }
</style>
