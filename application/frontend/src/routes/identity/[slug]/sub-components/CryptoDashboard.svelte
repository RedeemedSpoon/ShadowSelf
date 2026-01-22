<script lang="ts">
  import type {APIResponse, Coins} from '$type';
  import type {Writable} from 'svelte/store';
  import {deriveXPub} from '$cryptography';
  import {CopyButton} from '$component';
  import {identity} from '$store';

  interface Props {
    currentCrypto: Writable<Coins>;
    crypto: APIResponse;
  }

  let {currentCrypto, crypto}: Props = $props();

  const balance: number = $derived(crypto.wallet[$currentCrypto as 'btc'].balance);
  const usdBalance: number = $derived(balance * crypto.prices[$currentCrypto].to_usd);
  const statusClass: string = $derived(crypto.wallet[$currentCrypto].status.toLowerCase().replaceAll(' ', '-'));
  const growthClass: string = $derived(crypto.prices[$currentCrypto].daily_change > 0 ? 'up' : 'down');

  const rate = $derived(crypto.fees[$currentCrypto]);
  const feesLabel = $derived(
    (() => {
      if (['eth', 'usdt'].includes($currentCrypto)) return 'Gwei';
      if ($currentCrypto === 'xmr') return 'atomic';
      return 'sat/vB';
    })(),
  );

  const feesPercentile = $derived(
    (() => {
      if (['eth', 'usdt'].includes($currentCrypto)) return rate < 1 ? 'Low' : rate < 10 ? 'Avg' : 'High';
      else if ($currentCrypto === 'btc') return rate <= 4 ? 'Low' : rate <= 20 ? 'Avg' : 'High';
      else return 'Low'; // LTC and XMR are basically always cheap
    })(),
  );

  const feesUsd = $derived(
    (() => {
      const price = crypto.prices[$currentCrypto === 'usdt' ? 'eth' : $currentCrypto]?.to_usd || 0;
      if (['eth', 'usdt'].includes($currentCrypto)) return '$' + (((rate * 21000) / 1e9) * price).toFixed(2);
      if (['btc', 'ltc'].includes($currentCrypto)) return '$' + (((rate * 140) / 1e8) * price).toFixed(2);
      if ($currentCrypto === 'xmr') {
        const cost = (rate / 1e12) * price;
        return cost < 0.01 ? '< $0.01' : '$' + cost.toFixed(2);
      }

      return '$0.00';
    })(),
  );

  const intelRaw = $derived(
    (() => {
      const w = crypto.wallet[$currentCrypto] as unknown as {utxos: any[]; nonce: number};
      if ($currentCrypto === 'btc' || $currentCrypto === 'ltc') return w.utxos.length;
      else if ($currentCrypto === 'eth' || $currentCrypto === 'usdt') return w.nonce;
      else return null;
    })(),
  );

  const intelDisplay = $derived(
    (() => {
      if (intelRaw === null) return {label: 'Encryption', value: 'RingCT', percentile: 'max'};

      if (['btc', 'ltc'].includes($currentCrypto)) {
        if (intelRaw === 0) return {label: 'UTXOs', value: intelRaw, percentile: 'Empty'};
        if (intelRaw <= 5) return {label: 'UTXOs', value: intelRaw, percentile: 'Optimized'};
        if (intelRaw <= 15) return {label: 'UTXOs', value: intelRaw, percentile: 'Fragmented'};
        return {label: 'UTXOs', value: intelRaw, percentile: 'Bloated'};
      } else if (['eth', 'usdt'].includes($currentCrypto)) {
        if (intelRaw === 0) return {label: 'Nonce', value: intelRaw, percentile: 'Fresh'};
        return {label: 'Nonce', value: intelRaw, percentile: 'Active'};
      }
    })(),
  );
</script>

<section class="my-8">
  <div id="top-section" class="flex justify-between">
    <div id="left-section" class="w-2/3">
      <p><b>Balance:</b>{balance} {$currentCrypto.toUpperCase()} <span class="text-neutral-500">({usdBalance.toFixed(2)}$)</span></p>
      <p class="w-1/3">
        <b>Address:</b>
        {#if $currentCrypto === 'btc'}
          {@const btc = deriveXPub('btc', $identity.wallet_keys.btc, 0)}
          <CopyButton otherAlt={true} className={'-my-3!'} alt={true} label={`${btc.slice(0, 20)}...`} text={btc} />
        {:else if $currentCrypto === 'ltc'}
          {@const ltc = deriveXPub('ltc', $identity.wallet_keys.ltc, 0)}
          <CopyButton otherAlt={true} className={'-my-3!'} alt={true} label={`${ltc.slice(0, 20)}...`} text={ltc} />
        {:else if $currentCrypto === 'xmr'}
          {@const xmr = $identity.wallet_keys.xmr.address}
          <CopyButton otherAlt={true} className={'-my-3!'} alt={true} label={`${xmr.slice(0, 20)}...`} text={xmr} />
        {:else}
          {@const eth = $identity.wallet_keys.evm}
          <CopyButton otherAlt={true} className={'-my-3!'} alt={true} text={eth} label={`${eth.slice(0, 20)}...`} />
        {/if}
      </p>
      <p>
        <b>Growth (24h):</b>
        <span class={growthClass}>{growthClass === 'up' ? '↗' : '↘'} {crypto.prices[$currentCrypto].daily_change.toFixed(3)}%</span>
      </p>
    </div>
    <div id="right-section" class="w-1/3">
      <p>
        <b>Fees:</b><span class={feesPercentile.toLowerCase()}>{feesPercentile}</span>
        <span class="text-neutral-500">({crypto.fees[$currentCrypto]} {feesLabel} or {feesUsd})</span>
      </p>
      <p><b>Status:</b><span class={statusClass}>{crypto.wallet[$currentCrypto].status}</span></p>
      <p>
        <b>{intelDisplay!.label}:</b>{intelDisplay!.value}
        <span class={intelDisplay!.percentile.toLowerCase()}>({intelDisplay!.percentile.trim()})</span>
      </p>
    </div>
  </div>
  <div id="bottom-section"></div>
</section>

<style lang="postcss">
  @reference "$style";

  b {
    @apply text-primary-600;
  }

  #left-section p,
  #right-section p {
    @apply flex gap-2 text-neutral-300;
  }

  .up,
  .max,
  .fresh,
  .synced,
  .optimized,
  .network-operational,
  .low {
    @apply text-green-600;
  }

  .down,
  .fragmented,
  .active,
  .avg {
    @apply text-amber-600;
  }

  .network-error,
  .bloated,
  .high {
    @apply text-red-600;
  }
</style>
