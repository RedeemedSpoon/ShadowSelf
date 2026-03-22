<script lang="ts">
  import ActionIcon from '$component/feedback/ActionIcon.svelte';
  import Modal from '$component/containers/Modal.svelte';
  import Loader from '$component/feedback/Loader.svelte';

  import ReceiptIcon from '$icon/finance/Receipt.svelte';
  import FloppyIcon from '$icon/actions/Floppy.svelte';
  import MarketIcon from '$icon/finance/Market.svelte';
  import ShuffleIcon from '$icon/misc/Shuffle.svelte';
  import BackIcon from '$icon/navigation/Back.svelte';
  import USDTIcon from '$icon/brands/USDT.svelte';
  import BTCIcon from '$icon/brands/BTC.svelte';
  import LTCIcon from '$icon/brands/LTC.svelte';
  import ETHIcon from '$icon/brands/ETH.svelte';
  import XMRIcon from '$icon/brands/XMR.svelte';

  import cart from '$image/empty-states/cart.svg';
  import lock from '$image/empty-states/lock.svg';

  import CryptoDashboardHistory from './CryptoDashboardHistory.svelte';
  import CryptoDashboardStats from './CryptoDashboardStats.svelte';
  import CryptoInvoice from './CryptoInvoice.svelte';
  import CryptoReceive from './CryptoReceive.svelte';
  import CryptoMarket from './CryptoMarket.svelte';
  import CryptoSweep from './CryptoSweep.svelte';
  import CryptoSend from './CryptoSend.svelte';
  import CryptoSwap from './CryptoSwap.svelte';

  import {identity, moneroData, masterPassword, activeModal} from '$store';
  import type {Coins, CryptoAPI} from '$type';
  import {decrypt} from '$utils/cryptography';
  import initMoneroScan from '$utils/monero';
  import {fetchAPI} from '$utils/webfetch';
  import {writable} from 'svelte/store';

  let crypto = $state({}) as CryptoAPI;
  let xmrScanProgress = $state(0);
  let xmrScannedBlocks = $state(0);
  let xmrTotalBlocks = $state(0);
  let xmrHasLocalCache = $state(false);

  const currentCrypto = writable<Coins>('btc');
  let mode = writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'market' | 'swap'>('view');

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

  const title = $derived(`${cryptoTitles[$currentCrypto]} (${$currentCrypto.toUpperCase()})`);
  let anchor = $state() as HTMLAnchorElement;

  async function fetchWalletData() {
    await new Promise((resolve) => setTimeout(resolve, 10));
    document.getElementById('hold-load')?.remove();

    //@ts-ignore
    crypto.wallet = {};
    //@ts-ignore
    crypto.wallet.xmr = {};

    $moneroData = {
      viewKey: await decrypt($identity.walletKeys.xmr.viewKey),
      spendKey: await decrypt($identity.walletKeys.xmr.spendKey),
      address: await decrypt($identity.walletKeys.xmr.address),
    };

    const cryptoPromise = fetchAPI<CryptoAPI>('crypto', 'GET');
    const xmrNodePromise = fetchAPI<CryptoAPI>('crypto/xmr-node', 'GET');

    const scanPromise = xmrNodePromise.then((res) =>
      initMoneroScan(
        res,
        (hasCache) => (xmrHasLocalCache = hasCache),
        (progress, scanned, total) => {
          xmrScanProgress = progress;
          xmrScannedBlocks = scanned;
          xmrTotalBlocks = total;
          crypto.wallet.xmr.status = 'Scanning...';
        },
        (xmrData) => Object.assign(crypto.wallet.xmr, xmrData),
        () => (crypto.wallet.xmr.status = 'Network Error'),
      ),
    );

    [crypto, crypto.wallet.xmr] = await Promise.all([cryptoPromise, scanPromise]);
  }

  async function backupKeys() {
    const mnemonicCode = await decrypt($identity.walletBlob);
    const text = `
# ----------------------------------------------------------------------
# SHADOWSELF - CRYPTO RECOVERY KIT
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
    <ActionIcon icon={MarketIcon} action={() => ($mode = 'market')} title="Spend & Discover" />
    <ActionIcon icon={ShuffleIcon} action={() => ($mode = 'swap')} title="Swap Coins" />
  </div>
</section>

{#if $masterPassword}
  <div id="hold-load" class="h-[40vh]"></div>
  {#await fetchWalletData()}
    <div class="flex h-[40vh] items-center justify-center">
      <h4 class="flex items-center gap-6">
        <Loader size="big" skip={true} />Fetching
      </h4>
    </div>
  {:then}
    {#if $mode === 'view'}
      <div class="mt-[5vh] mb-2 flex justify-between gap-4 max-md:flex-col md:items-center">
        <h3 class="text-3xl! font-semibold text-neutral-300 lg:text-4xl!">{title}</h3>
        <div id="cryptocoins" class="flex">
          {#each Object.keys(cryptoIcons) as coin}
            {@const SvelteComponent = cryptoIcons[coin as Coins]}
            <button class:selected={$currentCrypto === coin} onclick={() => ($currentCrypto = coin as Coins)}>
              <SvelteComponent />
            </button>
          {/each}
        </div>
      </div>

      {#if $currentCrypto === 'xmr' && xmrScanProgress !== 100}
        <section class="my-12 flex flex-col items-center gap-6">
          <h3 class="text-4xl font-bold text-neutral-300 md:text-5xl">Syncing Monero Wallet</h3>
          <div class="text-center text-sm leading-relaxed text-neutral-400 md:w-2/3">
            To maintain a strict zero-knowledge architecture, your Private View/Spend Key never leaves this device. Instead of trusting
            our servers, your browser is scanning the Monero blockchain locally to cryptographically derive your balance.
          </div>

          <p class="font-semibold text-amber-600">
            {xmrHasLocalCache
              ? 'Local cache found. Fast-syncing recent network blocks.'
              : 'Building local cache. This initial chain scan will take several minutes.'}
          </p>

          <div class="mt-6 flex w-full max-w-md flex-col gap-2">
            <div class="flex justify-between font-mono text-sm font-bold text-neutral-300">
              <span class="animate-pulse">
                {crypto.wallet.xmr.status} ({xmrScannedBlocks.toLocaleString()} / {xmrTotalBlocks.toLocaleString()} blocks)
              </span>
              <span class="animate-pulse">{xmrScanProgress}%</span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-neutral-900 shadow-inner ring-2 ring-neutral-800">
              <div class="bg-primary-600 h-full transition-all duration-300 ease-out" style="width: {xmrScanProgress}%"></div>
            </div>
          </div>
          <div class="text-center text-xs text-neutral-500 md:w-1/3">
            Do not navigate away from this page or switch tabs. Interrupting the background worker will discard current progress and
            force a full rescan.
          </div>
        </section>
      {:else if crypto.wallet[$currentCrypto].history.length === 0}
        <section id="no-funds" style="background-image: url({cart});">
          <h2 class="mt-12 text-5xl text-neutral-300">No Funds</h2>
          <p class="text-center md:w-1/2">
            No money has been transferred to this wallet and no spending has been made yet. Send some funds over and start using it
            right away!
          </p>
          <button onclick={() => ($activeModal = 4)}>Add Funds</button>
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
                <button class="alt px-0 py-0 text-sm" onclick={() => (($activeModal = 0), ($mode = 'receive'))}>Here</button>
                to generate a ghost address. Send funds from Coinbase, Binance, or your personal wallet.
              </p>
            </div>

            <div class="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-800/30 p-4">
              <h3 class="text-lg font-medium text-neutral-300">2. Cash Deposit (Paper Wallet)</h3>
              <p class="text-sm text-neutral-400">
                Bought Crypto at an ATM? Click
                <button class="alt px-0 py-0 text-sm" onclick={() => (($activeModal = 0), ($mode = 'sweep'))}>Here</button> action to scan
                your paper receipt receipt. We will instantly move the funds into your secure vault.
              </p>
            </div>

            <div class="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-800/30 p-4">
              <h3 class="text-lg font-medium text-neutral-300">3. Buy with Fiat (No ID)</h3>
              <p class="text-sm text-neutral-400">
                We do not process credit cards to protect your privacy. To buy crypto anonymously using Bank Transfer or Neo-banks, we
                recommend P2P markets.
              </p>
              <div class="mt-1 flex gap-4">
                <a href="https://learn.robosats.org" target="_blank">RoboSats (Tor) ↗</a>
                <a href="https://bisq.network" target="_blank">Bisq ↗</a>
                <a href="https://hodlhodl.com" target="_blank">HodlHodl ↗</a>
              </div>
            </div>
            <button onclick={() => ($activeModal = 0)}>Got it</button>
          </div>
        </Modal>
      {:else}
        <CryptoDashboardStats {mode} {cryptoTitles} {currentCrypto} {crypto} />
        <CryptoDashboardHistory {currentCrypto} {crypto} />
      {/if}
    {:else if $mode === 'receive'}
      <CryptoReceive {cryptoTitles} {currentCrypto} {crypto} />
    {:else if $mode === 'send'}
      <CryptoSend {cryptoTitles} {currentCrypto} {crypto} />
    {:else if $mode === 'sweep'}
      <CryptoSweep {currentCrypto} {crypto} />
    {:else if $mode === 'swap'}
      <CryptoSwap {cryptoIcons} {crypto} />
    {:else if $mode === 'market'}
      <CryptoMarket />
    {:else if $mode === 'invoice'}
      <CryptoInvoice {cryptoIcons} {crypto} />
    {/if}
  {/await}
{:else}
  <section id="no-funds" style="background-image: url({lock});">
    <h2 class="mt-12 text-center text-5xl text-neutral-300">Encryption Key Missing</h2>
    <p class="text-center md:w-1/2">
      Your local session is missing the decryption key. Re-enter your Master Password to restore access to this identity crypto wallet.
    </p>
    <button onclick={() => ($activeModal = 1)}>Enter Master Password</button>
  </section>
{/if}

<style lang="postcss">
  @reference "$style";

  #no-funds {
    @apply mt-12 mb-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }

  h4 {
    @apply text-5xl text-neutral-300;
  }

  #cryptocoins button {
    @apply rounded-none bg-none shadow-none hover:bg-neutral-800/50 hover:bg-none;
    @apply cursor-pointer border border-neutral-800 bg-neutral-800/30 px-4 py-3 first:rounded-l-md last:rounded-r-md;
  }

  #cryptocoins button.selected {
    @apply bg-primary-600 text-neutral-300;
  }
</style>
