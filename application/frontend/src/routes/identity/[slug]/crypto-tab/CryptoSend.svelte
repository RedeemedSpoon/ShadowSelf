<script lang="ts">
  import {estimateTransactionFee, selectBestUtxos, signTransaction} from '$utils/wallet';
  import type {CryptoAPI, Coins, Priority, transactionData, UTXOData} from '$type';
  import CameraIcon from '$icon/misc/Camera.svelte';
  import StackIcon from '$icon/data/Stack.svelte';
  import QrScanner from '$component/special/QrScanner.svelte';
  import LoadingButton from '$component/buttons/LoadingButton.svelte';
  import type {Writable} from 'svelte/store';
  import {pendingID, identity} from '$store';
  import {decrypt} from '$utils/cryptography';
  import {idbOperation} from '$utils/monero';
  import {formatUSD} from '$utils/formating';
  import {fetchAPI} from '$utils/webfetch';
  import {onMount} from 'svelte';
  import {notify} from '$utils/shared';

  import * as monerots from 'monero-ts';

  interface Props {
    cryptoTitles: {[key: string]: string};
    currentCrypto: Writable<Coins>;
    crypto: CryptoAPI;
  }

  let {currentCrypto, cryptoTitles, crypto}: Props = $props();

  let amount = $state() as number;
  let scanning = $state(false);
  let destinationAddress = $state('');
  let selectedUtxos: UTXOData = $state([]);
  let selectedPriority: Priority = $state('low');

  let newUtxoWallet = $derived(!(['btc', 'ltc'].includes($currentCrypto) && crypto.wallet[$currentCrypto as 'btc'].nextIndex !== 0));

  const estimatedFee = $derived(
    estimateTransactionFee($currentCrypto, selectedUtxos, crypto.fees[$currentCrypto][selectedPriority], amount),
  );

  function automaticUtxoSelection() {
    if (['btc', 'ltc'].includes($currentCrypto)) {
      const currentSum = selectedUtxos.reduce((acc, u) => acc + u.value, 0);
      const targetSats = amount * 100_000_000;
      if (selectedUtxos.length > 0 && currentSum >= targetSats) return;

      const allUtxos = crypto.wallet[$currentCrypto as 'btc'].utxos;
      selectedUtxos = selectBestUtxos(allUtxos, amount, crypto.fees[$currentCrypto][selectedPriority]);
    }
  }

  function toggleUtxo(givenUtxo: UTXOData[number]) {
    const isSelected = selectedUtxos.some((utxo) => utxo.txid === givenUtxo.txid);
    if (isSelected) selectedUtxos = selectedUtxos.filter((utxo) => utxo.txid !== givenUtxo.txid);
    else selectedUtxos.push(givenUtxo);
  }

  function scanQRCode(result: string) {
    const clean = result
      .replace('bitcoin:', '')
      .replace('litecoin:', '')
      .replace('monero:', '')
      .replace('ethereum:', '')
      .split('?')[0];

    destinationAddress = clean;
    scanning = false;
  }

  async function sendFunds() {
    const [addr, amt] = [String(destinationAddress).trim(), Math.max(Number(amount), 0)];
    const successMessage = `Successfully sent ${amt.toFixed(5)} ${$currentCrypto.toUpperCase()}`;

    $pendingID = 1;
    await new Promise((resolve) => setTimeout(resolve, 650));

    if ($currentCrypto === 'xmr') {
      try {
        const localData = await idbOperation('readonly', $identity.id);
        const wallet = await monerots.openWalletFull({
          networkType: monerots.MoneroNetworkType.MAINNET,
          server: {uri: crypto.wallet.xmr.nodeUrl},
          password: 'shadowself_xmr',
          keysData: localData.keys,
          cacheData: localData.cache,
          fs: {promises: {stat: () => Promise.reject(new Error('Memory'))}} as any,
        });

        await wallet.sync();
        const priorityMap = {low: 1, medium: 2, high: 3};

        await wallet.createTx({
          accountIndex: 0,
          address: addr,
          amount: BigInt(amt * 1e12),
          relay: true,
          priority: priorityMap[selectedPriority],
        });

        const memoryBuffers = await wallet.getData();
        await idbOperation('readwrite', $identity.id, {keys: memoryBuffers[0], cache: memoryBuffers[1]});
        await wallet.close();

        notify(successMessage, 'success');
      } catch (e: any) {
        notify(e.message || 'Failed to send Monero transaction', 'alert');
      }

      $pendingID = 0;
      return;
    }

    const data: transactionData = {
      estimatedFee: ['btc', 'ltc'].includes($currentCrypto) ? estimatedFee : crypto.fees[$currentCrypto][selectedPriority],
      privKeyType: 'mnemonic',
      wifKey: await decrypt($identity.walletBlob),
      index: Math.max(0, crypto.wallet[$currentCrypto as 'btc'].nextIndex),
      xpubKey: $identity.walletKeys[$currentCrypto as 'btc'],
      utxos: crypto.wallet[$currentCrypto as 'btc'].utxos,
      nonce: crypto.wallet[$currentCrypto as 'eth'].nonce,
      balance: crypto.wallet[$currentCrypto as 'eth'].balance,
    };

    const broadcastPayload = await signTransaction($currentCrypto, addr, amt, data);
    if (!broadcastPayload) {
      $pendingID = 0;
      return;
    }

    const response = await fetchAPI<CryptoAPI>('crypto/broadcast', 'POST', broadcastPayload!);
    notify(response.err ? response.err : successMessage, response.type);
    $pendingID = 0;
  }

  onMount(automaticUtxoSelection);
</script>

<section class="mt-8 flex flex-col gap-6">
  <div class="flex flex-col gap-4">
    <h3>Send {cryptoTitles[$currentCrypto]}</h3>
    <div class="flex flex-col gap-1">
      <label for="amount">
        Amount in {$currentCrypto.toUpperCase()}
        <span class="text-neutral-500">(1 {$currentCrypto.toUpperCase()} = {formatUSD(crypto.prices[$currentCrypto].usdPrice)})</span>
      </label>
      <input bind:value={amount} onchange={automaticUtxoSelection} type="number" name="amount" placeholder="0.00" />
    </div>

    <div class="flex flex-col gap-1">
      <label for="address">Receiver Address</label>
      <div class="flex gap-2">
        <input type="text" name="address" bind:value={destinationAddress} placeholder="Paste address here..." class="w-full" />
        <button onclick={() => (scanning = true)}><CameraIcon className="w-5 h-5" /></button>
      </div>

      {#if scanning}
        <QrScanner onScan={scanQRCode} close={() => (scanning = false)} />
      {/if}
    </div>

    <div class="flex flex-col gap-2">
      <label for="fees">Network Priority (Miner Fee)</label>
      <div class="grid grid-cols-3 gap-2">
        {#each ['low', 'medium', 'high'] as p (p)}
          <div
            aria-hidden="true"
            class="fee-box {selectedPriority === p && 'selected'}"
            onclick={() => (selectedPriority = p as 'low')}>
            <span class="text-sm font-bold text-neutral-300 capitalize">{p}</span>
            <span class="text-xs {selectedPriority === p ? 'text-neutral-300' : 'text-neutral-500'}">
              {crypto.fees[$currentCrypto][p as 'low']}
              {['eth', 'usdt'].includes($currentCrypto) ? 'Gwei' : $currentCrypto === 'xmr' ? 'Atomic Units' : 'sat/vB'}
            </span>
          </div>
        {/each}
      </div>
      <small class="text-right text-xs text-neutral-500">
        Estimated Fee:
        <span class="text-neutral-300"> {estimatedFee.fee} {estimatedFee.unit} </span>
        <span>(~{formatUSD(Number(estimatedFee.fee) * crypto.prices[$currentCrypto].usdPrice)})</span>
      </small>
    </div>
  </div>

  {#if !newUtxoWallet}
    <div class="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <div class="mb-4">
        <h4 class="flex items-center gap-2 text-xl font-semibold text-neutral-300">
          <StackIcon className="w-8 h-8" />Coin Control<span class="text-neutral-500">(Advanced)</span>
        </h4>
        <p class="mt-1 text-sm leading-relaxed text-neutral-500">
          Manually select which UTXOs (coins) to spend. We automatically select them for you but you can update it here.
          <br />
          <span class="text-amber-600">Why?</span> Mixing coins from different sources (e.g. KYC Exchange + Private Trade) links them permanently
          on the blockchain. Keep them separate to preserve your synthetic identities.
        </p>
      </div>
      <table class="w-full text-left text-sm">
        <thead class="border-b border-neutral-800 text-xs text-neutral-500 uppercase">
          <tr>
            <th class="w-10 p-2">Select</th>
            <th class="p-2">Amount</th>
            <th class="p-2">Address Location</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-800 select-none">
          {#each crypto.wallet[$currentCrypto as 'btc'].utxos as utxo (utxo.txid)}
            <tr class="cursor-pointer hover:bg-neutral-800/40" onclick={() => toggleUtxo(utxo)}>
              <td class="p-2">
                <input type="checkbox" checked={selectedUtxos.includes(utxo)} />
              </td>
              <td class="p-2 font-mono text-neutral-300">
                {utxo.value / 100_000_000}
                {$currentCrypto.toUpperCase()}
              </td>
              <td class="max-w-62.5 truncate p-2 font-mono text-xs text-neutral-500" title={utxo.address}>
                {utxo.address}
                <span class="ml-2 rounded bg-neutral-800 px-1 text-neutral-400">#{utxo.pathIndex}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <LoadingButton type="button" onclick={sendFunds} className="font-semibold">Sign & Broadcast Transaction</LoadingButton>
</section>

<style lang="postcss">
  @reference "$style";

  h3 {
    @apply text-3xl font-bold text-neutral-300;
  }

  label {
    @apply text-sm font-medium text-neutral-400;
  }

  .fee-box {
    @apply flex flex-col items-center justify-center transition-all duration-300 ease-in-out;
    @apply cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 hover:text-neutral-400;
  }

  .fee-box.selected {
    @apply bg-primary-600 hover:text-neutral-300;
  }

  .fee-box span {
    @apply transition-all duration-300 ease-in-out;
  }

  input[type='checkbox'] {
    @apply border-neutral-800 bg-neutral-900 focus:ring-0 focus:ring-offset-0 focus:outline-none;
    @apply checked:border-primary-600 checked:bg-primary-600 h-4 w-4 cursor-pointer rounded;
  }
</style>
