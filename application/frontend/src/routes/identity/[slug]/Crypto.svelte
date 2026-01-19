<script lang="ts">
  import {ReceiptIcon, FloppyIcon, ShuffleIcon, CameraIcon, ShopIcon} from '$icon';
  import {BTCIcon, LTCIcon, ETHIcon, USDTIcon, XMRIcon, BackIcon} from '$icon';
  import {identity, masterPassword, modalIndex} from '$store';
  import {ActionIcon, Modal, CopyButton} from '$component';
  import {decrypt, deriveXPub} from '$cryptography';
  import {writable} from 'svelte/store';
  import {cart, lock} from '$image';
  import type {Coins} from '$type';
  import {fetchAPI} from '$fetch';
  import {onMount} from 'svelte';

  import CryptoTransaction from './sub-components/CryptoTransaction.svelte';
  import CryptoServices from './sub-components/CryptoServices.svelte';

  onMount(async () => console.log(await fetchAPI('crypto', 'GET')));

  const currentCrypto = writable<Coins>('btc');
  let mode = writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'gift' | 'swap'>('view');

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
  let anchor = $state() as HTMLAnchorElement;

  async function backupKeys() {
    const mnemonicCode = await decrypt($identity.wallet_blob);
    const text = `
# ----------------------------------------------------------------------
# SHADOWSELF - IDENTITY RECOVERY KIT
# ----------------------------------------------------------------------

[1] YOUR SECRET KEY (SEED PHRASE)
${mnemonicCode}

[2] HOW TO USE
This is your Master Key. It derivates all your Bitcoin, Monero, Litecoin, 
and Ethereum private keys. You do not need ShadowSelf to use this money.

[3] HOW TO RESTORE
Download "Electrum" (Bitcoin), "Feather Wallet" (Monero), or "Trust Wallet" (Mobile).
Select "I have a seed phrase" and type the 12 words above.

[4] SECURITY
DO NOT SAVE THIS ON YOUR COMPUTER.
Print this file. Delete this file.
If a hacker finds this file, your money is gone.

# ----------------------------------------------------------------------
# END OF FILE
# ----------------------------------------------------------------------
`.trim();

    const blob = new Blob([text], {type: 'text/plain'});
    anchor.href = URL.createObjectURL(blob);
    anchor.click();
  }

  function toggleDust() {}
  function exportCSV() {}
</script>

<a bind:this={anchor} aria-label="Download" href="/" download="ShadowSelf-Mnemonic-Backup-Code.txt" class="hidden"></a>
<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-2xl font-bold text-neutral-300 sm:text-4xl md:text-5xl">Crypto Wallet</h1>
  <div class="grid gap-1 max-md:grid-cols-3 md:grid-flow-col {!$masterPassword && 'hidden'}">
    {#if $mode != 'view'}
      <ActionIcon icon={BackIcon} action={() => ($mode = 'view')} title="Go Back" />
    {/if}
    <ActionIcon icon={FloppyIcon} action={backupKeys} title="Backup Keys" />
    <ActionIcon icon={ReceiptIcon} action={() => ($mode = 'invoice')} title="Generate PDF Invoice" />
    <ActionIcon icon={CameraIcon} action={() => ($mode = 'sweep')} title="Sweep Wallet" />
    <ActionIcon icon={ShopIcon} action={() => ($mode = 'gift')} title="Buy Gift Cards" />
    <ActionIcon icon={ShuffleIcon} action={() => ($mode = 'swap')} title="Swap Coins" />
  </div>
</section>
{#if $masterPassword}
  {#if $mode === 'view'}
    <div class="mt-[5vh] mb-2 flex justify-between gap-4 max-md:flex-col md:items-center">
      <div class="[*&>p]:text-neutral-500!">
        <h3 class="-mb-4 text-2xl! font-semibold text-neutral-300 lg:text-3xl!">{title} Address :</h3>
        {#if $currentCrypto === 'btc'}
          <CopyButton alt={true} text={deriveXPub('btc', $identity.wallet_keys.btc, 0)} />
        {:else if $currentCrypto === 'ltc'}
          <CopyButton alt={true} text={deriveXPub('ltc', $identity.wallet_keys.ltc, 0)} />
        {:else if $currentCrypto === 'xmr'}
          <CopyButton alt={true} label={$identity.wallet_keys.xmr.address.slice(0, 50)} text={$identity.wallet_keys.xmr.address} />
        {:else}
          <CopyButton alt={true} text={$identity.wallet_keys.evm} />
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
    <section id="no-purchases" style="background-image: url({cart});">
      <h2 class="mt-12 text-5xl text-neutral-300">No Funds</h2>
      <p class="text-center md:w-1/2">
        No money has been transferred to this wallet and no spending has been made yet. Send some funds over and start using it right
        away!
      </p>
      <button onclick={() => ($modalIndex = 4)}>Add Funds</button>
    </section>
    <Modal id={4}>
      <div class="flex flex-col gap-6 p-6">
        <div class="space-y-1">
          <h1 class="text-4xl font-semibold text-neutral-200">Fund Your Wallet</h1>
          <p class="text-neutral-400">Your wallet is empty. Here is how to load it securely.</p>
        </div>

        <div class="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-800/30 p-4">
          <h3 class="text-lg font-medium text-neutral-300">1. Direct Transfer</h3>
          <p class="text-sm text-neutral-400">
            Already have crypto? Click
            <button class="alt px-0 py-0 text-sm" onclick={() => (($modalIndex = 0), ($mode = 'receive'))}>Here</button>
            to generate a ghost address. Send funds from Coinbase, Binance, or your personal wallet.
          </p>
        </div>

        <div class="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-800/30 p-4">
          <h3 class="text-lg font-medium text-neutral-300">2. Cash Deposit (Paper Wallet)</h3>
          <p class="text-sm text-neutral-400">
            Bought Bitcoin at an ATM? Use the <span class="rounded bg-neutral-700 px-1 text-white">Sweep</span> action to scan your paper
            receipt receipt. We will instantly move the funds into your secure vault.
          </p>
        </div>

        <div class="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-800/30 p-4">
          <h3 class="text-lg font-medium text-neutral-300">3. Buy with Fiat (No ID)</h3>
          <p class="text-sm text-neutral-400">
            We do not process credit cards to protect your privacy. To buy crypto anonymously using Bank Transfer or Neo-banks, we
            recommend P2P markets.
          </p>
          <div class="mt-1 flex gap-4">
            <a href="https://learn.robosats.org" target="_blank"> RoboSats (Tor) ↗ </a>
            <a href="https://bisq.network" target="_blank"> Bisq ↗ </a>
            <a href="https://hodlhodl.com" target="_blank"> HodlHodl ↗ </a>
          </div>
        </div>
        <button onclick={() => ($modalIndex = 0)}> Got it </button>
      </div>
    </Modal>
  {:else}
    <CryptoServices {mode} />
    <CryptoTransaction {mode} />
  {/if}
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
