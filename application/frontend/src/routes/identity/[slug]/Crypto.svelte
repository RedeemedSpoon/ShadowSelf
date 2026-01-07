<script lang="ts">
  import {ReceiptIcon, FloppyIcon, ShuffleIcon, DownArcIcon, UpArcIcon, BroomIcon, SpreadSheetIcon, CameraIcon, ShopIcon} from '$icon';
  import {BTCIcon, LTCIcon, ETHIcon, USDTIcon, XMRIcon} from '$icon';
  import {identity, masterPassword, modalIndex} from '$store';
  import {writable} from 'svelte/store';
  import {ActionIcon} from '$component';
  import {deriveXPub} from '$crypto';
  import {cart, lock} from '$image';
  import type {Coins} from '$type';
  import {fetchAPI} from '$fetch';
  import {onMount} from 'svelte';

  onMount(async () => console.log(await fetchAPI('crypto', 'GET')));

  const currentCrypto = writable<Coins>('btc');
  const mode = writable<'dashboard'>('dashboard');

  const cryptoTitles = {
    btc: 'Bitcoin',
    ltc: 'Litecoin',
    eth: 'Ethereum',
    usdt: 'Tether',
    xmr: 'Monero',
  };

  const cryptoIcons = {
    btc: BTCIcon,
    ltc: LTCIcon,
    eth: ETHIcon,
    usdt: USDTIcon,
    xmr: XMRIcon,
  };

  const title = $derived(cryptoTitles[$currentCrypto]);
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-2xl font-bold text-neutral-300 sm:text-4xl md:text-5xl">Crypto Wallet</h1>
  <div class="grid gap-1 max-md:grid-cols-3 md:grid-flow-col">
    <ActionIcon disabled={!$masterPassword} icon={FloppyIcon} action={() => {}} title="Backup Keys" />
    <ActionIcon disabled={!$masterPassword} icon={BroomIcon} action={() => {}} title="Toggle Dust Transaction" />
    <ActionIcon disabled={!$masterPassword} icon={SpreadSheetIcon} action={() => {}} title="Export Transaction CSV" />
    <ActionIcon disabled={!$masterPassword} icon={ReceiptIcon} action={() => {}} title="Generate PDF Invoice" />
    <ActionIcon disabled={!$masterPassword} icon={CameraIcon} action={() => {}} title="Sweep Wallet" />
    <ActionIcon disabled={!$masterPassword} icon={DownArcIcon} action={() => {}} title="Receive Funds" />
    <ActionIcon disabled={!$masterPassword} icon={UpArcIcon} action={() => {}} title="Send Payment" />
    <ActionIcon disabled={!$masterPassword} icon={ShopIcon} action={() => {}} title="Buy Gift Cards" />
    <ActionIcon disabled={!$masterPassword} icon={ShuffleIcon} action={() => {}} title="Swap Coins" />
  </div>
</section>
{#if $masterPassword}
  {#key $currentCrypto}
    <div class="mt-[5vh] mb-2 flex justify-between gap-4 max-md:flex-col md:items-center">
      <div class="[*&>p]:text-neutral-500!">
        <h3 class="text-2xl! text-neutral-300 lg:text-3xl!">{title}</h3>
        {#if $currentCrypto === 'btc'}
          <p>{deriveXPub('btc', $identity.wallet_keys.btc, 0)}</p>
        {:else if $currentCrypto === 'ltc'}
          <p>{deriveXPub('ltc', $identity.wallet_keys.ltc, 0)}</p>
        {:else if $currentCrypto === 'xmr'}
          <p>{$identity.wallet_keys.xmr.address.slice(0, 50)}...</p>
        {:else}
          <p>{$identity.wallet_keys.evm}</p>
        {/if}
      </div>
      <div id="cryptocoins" class="flex">
        {#each Object.keys(cryptoIcons) as coin}
          <button class:selected={$currentCrypto === coin} onclick={() => ($currentCrypto = coin as Coins)}>
            {#if currentCrypto}
              {@const SvelteComponent = cryptoIcons[coin as Coins]}
              <SvelteComponent />
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/key}
  <section id="no-purchases" style="background-image: url({cart});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Purchases</h2>
    <p class="text-center md:w-1/2">
      No money has been transferred to this wallet and no spending has been made yet. Send some funds over and start using it right
      away!
    </p>
    <button>Add Funds</button>
  </section>
{:else}
  <section id="no-purchases" style="background-image: url({lock});">
    <h2 class="mt-12 text-center text-5xl text-neutral-300">Encryption Key Missing</h2>
    <p class="text-center md:w-1/2">
      Your local session is missing the decryption key. Re-enter your Master Password to restore access to this identity crypto wallet.
    </p>
    <button onclick={() => ($modalIndex = 1)}>Enter Master Password</button>
  </section>
{/if}

<style lang="postcss">
  @reference "$style";

  #no-purchases {
    @apply mt-12 mb-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  #cryptocoins button {
    @apply rounded-none bg-none shadow-none hover:bg-neutral-800/50 hover:bg-none;
    @apply cursor-pointer border border-neutral-800 bg-neutral-800/30 px-4 py-3 first:rounded-l-md last:rounded-r-md;
  }

  #cryptocoins button.selected {
    @apply bg-primary-600 text-neutral-300;
  }
</style>
