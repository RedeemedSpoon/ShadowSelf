<script lang="ts">
  import LoadingButton from '$component/buttons/LoadingButton.svelte';
  import SelectMenu from '$component/inputs/SelectMenu.svelte';

  import type {CryptoAPI, Coins, Provider, transactionData} from '$type';
  import {estimateTransactionFee, signTransaction} from '$utils/wallet';
  import ExternalLinkIcon from '$icon/navigation/ExternalLink.svelte';
  import {decrypt, deriveXPub} from '$utils/cryptography';
  import {pendingID, identity, moneroData} from '$store';
  import {onMount, type Component} from 'svelte';
  import {idbOperation} from '$utils/monero';
  import {formatUSD} from '$utils/formating';
  import {fetchAPI} from '$utils/webfetch';
  import * as monerots from 'monero-ts';
  import {notify} from '$utils/shared';

  interface Props {
    cryptoIcons: {[key: string]: Component};
    crypto: CryptoAPI;
  }

  let {cryptoIcons, crypto}: Props = $props();

  const coinOptions = [
    {label: 'Bitcoin', value: 'btc'},
    {label: 'Etherium', value: 'eth'},
    {label: 'Litecoin', value: 'ltc'},
    {label: 'Tether', value: 'usdt'},
    {label: 'Monero', value: 'xmr'},
  ];

  let payCoin = $state('btc') as Coins;
  let receiveCoin = $state('xmr') as Coins;
  let chooseProvider = $state(false);

  let swapAmount = $state(1);
  let receiveAmount = $state();
  let swapSuccess = $state(false);
  let trackingLink = $state('');

  function updateReceivedPrice() {
    const payUsdPrice = crypto.prices[payCoin].usdPrice * swapAmount;
    const receiveUsdPrice = crypto.prices[receiveCoin].usdPrice;
    receiveAmount = (payUsdPrice / receiveUsdPrice).toFixed(4);
  }

  let bestProviderIndex = $state(0);
  let selectedProviderIndex = $state(0);
  let providers: Provider[] = $state([]);
  let tradeID = $state('');

  async function newRates() {
    $pendingID = 1;

    const response = await fetchAPI<CryptoAPI>('crypto/swap-rates', 'GET', {
      coinFrom: payCoin,
      coinTo: receiveCoin,
      amount: swapAmount,
    });
    if (response.err) {
      $pendingID = 0;
      return notify(response.err, 'alert');
    }

    tradeID = response.tradeID!;
    providers = response.providers!;
    selectedProviderIndex = providers.findIndex((prov) => prov.name === response.bestProvider);
    bestProviderIndex = selectedProviderIndex;

    $pendingID = 0;
    chooseProvider = true;
  }

  async function swap() {
    $pendingID = 2;

    const provider = providers[selectedProviderIndex || 0].name;
    const isFixed = providers[selectedProviderIndex || 0].isFixed;
    let destinationAddress = '';
    let refundAddress = '';

    [payCoin, receiveCoin].forEach((coin: string, i: number) => {
      let tempAddr = coin === 'xmr' ? $moneroData.address : $identity.walletKeys.evm;

      if (coin === 'btc' || coin === 'ltc') {
        const xpub = $identity.walletKeys[coin];
        const nextIndex = crypto.wallet[coin as 'btc'].nextIndex;
        tempAddr = deriveXPub(coin, xpub, Math.max(0, nextIndex));
      }

      if (i === 0) refundAddress = tempAddr;
      if (i === 1) destinationAddress = tempAddr;
    });

    const payload = {
      tradeID,
      isFixed,
      provider,
      refundAddress,
      destinationAddress,
      coinTo: receiveCoin,
      coinFrom: payCoin,
      amount: swapAmount,
    };

    const response = await fetchAPI<CryptoAPI>('crypto/swap-trades', 'POST', payload);
    if (response.err) {
      $pendingID = 0;
      return notify(response.err, 'alert');
    }

    try {
      const amountToSend = Number(response.depositAmount);

      if (payCoin === 'xmr') {
        const localData = await idbOperation('readonly', $identity.id);
        if (!localData) notify('Wallet cache not found. Please wait for sync to complete.', 'alert');

        const wallet = await monerots.openWalletFull({
          networkType: monerots.MoneroNetworkType.MAINNET,
          server: {uri: crypto.wallet.xmr.nodeUrl},
          password: 'shadowself_xmr',
          keysData: localData.keys,
          cacheData: localData.cache,
          fs: {promises: {stat: () => Promise.reject(new Error('Memory'))}} as any,
        });

        await wallet.sync();

        await wallet.createTx({
          accountIndex: 0,
          address: response.depositAddress,
          amount: BigInt(amountToSend * 1e12),
          relay: true,
          priority: 2,
        });

        const memoryBuffers = await wallet.getData();
        await idbOperation('readwrite', $identity.id, {keys: memoryBuffers[0], cache: memoryBuffers[1]});
        await wallet.close();

        notify(`Sent ${amountToSend} XMR`, 'success');
      } else {
        const wifKey = await decrypt($identity.walletBlob);
        const feeRate = ['btc', 'ltc'].includes(payCoin) ? crypto.fees[payCoin as Coins].high : crypto.fees[payCoin as Coins].high;

        let txData: transactionData;

        if (payCoin === 'btc' || payCoin === 'ltc') {
          const utxos = crypto.wallet[payCoin as 'btc'].utxos;
          const feeObject = estimateTransactionFee(payCoin as Coins, utxos, feeRate, amountToSend);

          txData = {
            estimatedFee: feeObject,
            privKeyType: 'mnemonic',
            wifKey: wifKey,
            index: Math.max(0, crypto.wallet[payCoin as 'btc'].nextIndex),
            xpubKey: $identity.walletKeys[payCoin as 'btc'],
            utxos: utxos,
          };
        } else {
          txData = {
            estimatedFee: feeRate,
            privKeyType: 'mnemonic',
            wifKey: wifKey,
            nonce: crypto.wallet[payCoin as 'eth'].nonce,
            balance: crypto.wallet[payCoin as 'eth'].balance,
          };
        }

        const broadcastPayload = await signTransaction(payCoin as Coins, response.depositAddress!, amountToSend, txData);

        if (!broadcastPayload) {
          $pendingID = 0;
          return notify('Transaction signing cancelled', 'alert');
        }

        const broadcastRes = await fetchAPI<CryptoAPI>('crypto/broadcast', 'POST', broadcastPayload);
        if (broadcastRes.err) notify(broadcastRes.err, 'alert');

        notify(`Sent ${amountToSend} ${payCoin.toUpperCase()}`, 'success');
      }
    } catch (e: any) {
      $pendingID = 0;
      return notify(e.message || 'Swap execution failed, please try again.', 'alert');
    }

    $pendingID = 0;
    trackingLink = response.externalLink!;
    chooseProvider = false;
    swapSuccess = true;
  }

  onMount(updateReceivedPrice);
</script>

<section class="mx-auto my-8 {!chooseProvider && 'max-w-lg'} p-6">
  {#if swapSuccess}
    <div class="p-8 text-center">
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/50">
        <svg class="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-neutral-300">Swap Initiated</h3>
      <div class="mt-4 space-y-4">
        <p class="text-sm leading-relaxed text-neutral-400">
          Successfully broadcasted <span class="font-mono font-bold text-neutral-300">{swapAmount} {payCoin.toUpperCase()}</span>
          to the provider.
        </p>
        <p class="text-sm leading-relaxed text-neutral-400">
          Your transaction is now propagating through the mempool. The swap will execute automatically once the deposit confirms.
        </p>
      </div>

      <div class="mt-12 flex flex-col gap-3">
        <button type="button">
          <a href={trackingLink} target="_blank" class="inline-flex items-center gap-1 text-neutral-300" rel="noopener noreferrer">
            Track Status on Trocador <ExternalLinkIcon className="w-6 h-6" />
          </a>
        </button>
        <button onclick={() => window.location.reload()} class="alt w-full">Go Back</button>
      </div>

      <p class="mt-6 text-xs text-neutral-600">Note: This swap allows 15 minutes for the deposit to arrive.</p>
    </div>
  {:else if !chooseProvider}
    <div class="mb-6">
      <h3 class="text-2xl font-bold text-neutral-300">Swap Coins</h3>
      <p class="mt-2 text-sm leading-relaxed text-neutral-400">
        Exchange assets anonymously without KYC. All traffic is proxied through our servers to hide your identity.
      </p>
    </div>

    <div class="rounded-xl border-2 border-neutral-800 bg-neutral-950/50 p-4">
      <div class="mb-2 flex justify-between">
        <label for="from" class="text-xs font-medium text-neutral-400">
          You Pay <span class="text-neutral-600">({formatUSD(swapAmount * crypto.prices[payCoin as 'btc'].usdPrice)})</span>
        </label>
      </div>
      <div class="crypto-input flex items-center gap-4">
        <input type="number" bind:value={swapAmount} onchange={updateReceivedPrice} placeholder="0.00" />
        <SelectMenu
          name="pay"
          biggerPadding={true}
          options={coinOptions}
          fullIcons={cryptoIcons}
          value={payCoin}
          callback={(v) => ((payCoin = v as 'btc'), updateReceivedPrice())}
          size="small" />
      </div>
    </div>

    <div class="relative z-10 -my-2 flex justify-center">
      <div class="rounded-lg border-2 border-neutral-800 bg-neutral-900 p-2 text-neutral-400">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>

    <div class="rounded-xl border-2 border-neutral-800 bg-neutral-950/50 p-4">
      <div class="mb-2 flex justify-between">
        <label for="to" class="text-xs font-medium text-neutral-400">
          You Receive <span class="text-neutral-600">(Excluding Fees)</span>
        </label>
      </div>
      <div class="crypto-input flex items-center gap-4">
        <input type="number" placeholder="0.00" bind:value={receiveAmount} readonly disabled class="cursor-not-allowed" />
        <SelectMenu
          name="receive_coin"
          biggerPadding={true}
          options={coinOptions}
          fullIcons={cryptoIcons}
          value={receiveCoin}
          callback={(v) => ((receiveCoin = v as 'btc'), updateReceivedPrice())}
          size="small" />
      </div>
    </div>

    <div class="mt-6 flex flex-col gap-2 text-xs text-neutral-500">
      <div class="flex justify-between">
        <span>Refund Address:</span>
        <span class="font-mono text-neutral-400">Auto-filled</span>
      </div>
      <div class="flex justify-between">
        <span>Receiving Address:</span>
        <span class="font-mono text-neutral-400">Auto-filled</span>
      </div>
    </div>

    <LoadingButton index={1} onclick={newRates} className="mt-6 w-full font-semibold">Proceed to Swap</LoadingButton>
  {:else}
    <div class="mb-6">
      <h3 class="text-2xl font-bold text-neutral-300">Choose Provider</h3>
      <p class="mt-2 text-sm leading-relaxed text-neutral-400">
        Select a provider based on rate and privacy.
        <span class="rounded-full bg-neutral-800 px-2 py-1 font-mono">Grade A</span>
        indicates the highest privacy (No KYC/No Logs).
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 py-6 md:grid-cols-2 lg:grid-cols-3">
      {#each providers as provider, i}
        {@const costGrade = provider.costPercentage < -8 ? 'bad' : provider.costPercentage < -4 ? 'mid' : 'good'}
        <div
          aria-hidden="true"
          onclick={() => (selectedProviderIndex = i)}
          class="provider {i === selectedProviderIndex && 'selected'}">
          {#if bestProviderIndex === i}
            <div id="best-rate">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              Best Rate
            </div>
          {/if}

          <div class="flex w-full items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-700 bg-neutral-400/20 p-1">
                <img src={provider.logo} alt={provider.name} class="h-full w-full object-contain" />
              </div>
              <div>
                <h4 class="font-bold text-neutral-200">{provider.name}</h4>
                <div class="flex items-center gap-2 text-xs font-medium text-neutral-500">
                  <span class="capitalize">{provider.isFixed ? 'Fixed Rate' : 'Floating Rate'}</span>
                  <span class="h-1 w-1 rounded-full bg-neutral-600"></span>
                  <span>~{provider.eta} mins</span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <div class="text-xl font-bold tracking-tight text-neutral-300">
                {provider.returnCoin} <span class="text-sm font-medium text-neutral-500">{receiveCoin.toUpperCase()}</span>
              </div>
              <div class="text-xs font-medium text-neutral-500">
                ≈ {formatUSD(provider.returnUsd)} USD
              </div>
            </div>
          </div>

          <div class="flex w-full items-center justify-between border-t border-neutral-700/50 pt-3">
            <div class="flex gap-3 text-xs font-bold">
              <div class="flex items-center gap-1.5 rounded-md bg-neutral-950 px-2 py-1">
                <span class="text-neutral-500">KYC:</span>
                <span class={provider.kycRating}>{provider.kycRating}</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-md bg-neutral-950 px-2 py-1">
                <span class="text-neutral-500">Logs:</span>
                <span class={provider.logPolicy}>{provider.logPolicy}</span>
              </div>
            </div>
            <div class="text-xs text-neutral-500">
              Total Cost: <span class={costGrade}>{provider.costPercentage}%</span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="mt-8 flex justify-evenly gap-4">
      <button onclick={() => (chooseProvider = false)} class="alt">← Back</button>
      <LoadingButton index={2} onclick={swap} className="w-1/3">Confirm Swap</LoadingButton>
    </div>
  {/if}
</section>

<style lang="postcss">
  @reference "$style";

  .crypto-input > input {
    @apply w-full bg-transparent py-3 text-2xl;
  }

  .provider {
    @apply relative flex min-w-50 cursor-pointer flex-col gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200;
    @apply border-neutral-800 bg-neutral-950/10 hover:border-neutral-700 hover:bg-neutral-950/20;
  }

  .provider.selected {
    @apply border-primary-600 shadow-primary-600/10 bg-neutral-800/80 shadow-lg;
  }

  #best-rate {
    @apply bg-primary-600 absolute -top-3 left-4 flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wide text-neutral-300 uppercase shadow-md;
  }

  .good,
  .A {
    @apply text-green-500;
  }

  .mid,
  .B {
    @apply text-orange-500;
  }

  .bad,
  .C,
  .D {
    @apply text-red-500;
  }
</style>
