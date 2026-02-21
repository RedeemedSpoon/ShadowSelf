<script lang="ts">
  import {ReceiptIcon, FloppyIcon, ShuffleIcon, MarketIcon, BackIcon, BTCIcon, LTCIcon, ETHIcon, USDTIcon, XMRIcon} from '$icon';
  import {identity, moneroData, masterPassword, modalIndex} from '$store';
  import {ActionIcon, Modal, Loader} from '$component';
  import type {Coins, APIResponse} from '$type';
  import {decrypt} from '$cryptography';
  import {writable} from 'svelte/store';
  import {cart, lock} from '$image';
  import {fetchAPI} from '$fetch';

  import * as monerots from 'monero-ts';
  import CryptoTransaction from './sub-components/CryptoTransaction.svelte';
  import CryptoDashboard from './sub-components/CryptoDashboard.svelte';
  import CryptoServices from './sub-components/CryptoServices.svelte';

  let crypto = $state() as APIResponse;
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

    $moneroData = {
      viewKey: await decrypt($identity.walletKeys.xmr.viewKey),
      spendKey: await decrypt($identity.walletKeys.xmr.spendKey),
      address: await decrypt($identity.walletKeys.xmr.address),
    };

    const cryptoPromise = fetchAPI('crypto', 'GET');
    const xmrNodePromise = fetchAPI('crypto/xmr-node', 'GET');
    const scanPromise = xmrNodePromise.then((res) => initMoneroScan(res));

    const [cryptoRes, scanRes] = await Promise.all([cryptoPromise, scanPromise]);
    crypto = cryptoRes;
    crypto.wallet.xmr = scanRes;
  }

  class SyncListener extends monerots.MoneroWalletListener {
    private updateProgress: (percent: number) => void;

    constructor(updateProgress: (percent: number) => void) {
      super();
      this.updateProgress = updateProgress;
    }

    async onSyncProgress(_: number, __: number, ___: number, percentDone: number, ____: string): Promise<void> {
      this.updateProgress(percentDone);
    }
  }

  async function initMoneroScan(nodeData: any) {
    const genesisMs = 1397818133000;
    const startMs = new Date(nodeData.startingDate).getTime();
    const restoreHeight = Math.max(0, Math.floor((startMs - genesisMs) / 120000) - 10000);

    const initialState = {
      status: 'Connecting...',
      startingDate: nodeData.startingDate,
      nodeUrl: nodeData.nodeUrl,
      balance: 0,
      unlockedBalance: 0,
      history: [],
    };

    const processBlockchain = async () => {
      try {
        const wallet = await monerots.createWalletFull({
          networkType: monerots.MoneroNetworkType.MAINNET,
          primaryAddress: $moneroData.address,
          privateViewKey: $moneroData.viewKey,
          privateSpendKey: $moneroData.spendKey,
          server: {uri: nodeData.nodeUrl},
          restoreHeight,
        });

        const listener = new SyncListener((percentDone) => {
          if (crypto?.wallet?.xmr) {
            crypto.wallet.xmr.status = `Scanning... ${Math.floor(percentDone * 100)}%`;
          }
        });

        await wallet.addListener(listener);
        await wallet.sync();

        const [balance, unlocked, txs] = await Promise.all([wallet.getBalance(), wallet.getUnlockedBalance(), wallet.getTxs()]);

        const history = txs
          .map((tx: any) => {
            const incoming = Number(tx.getIncomingAmount() || 0);
            const outgoing = Number(tx.getOutgoingAmount() || 0);

            return {
              txid: String(tx.getHash()),
              type: (incoming > outgoing ? 'received' : 'sent') as 'sent',
              counterparty: 'RingCT Hidden',
              amount: Math.abs(incoming - outgoing) / 1e12,
              date: new Date((tx.getTimestamp() || Math.floor(Date.now() / 1000)) * 1000),
            };
          })
          .sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

        if (crypto?.wallet?.xmr) {
          crypto.wallet.xmr.balance = Number(balance) / 1e12;
          crypto.wallet.xmr.unlockedBalance = Number(unlocked) / 1e12;
          crypto.wallet.xmr.history = history;
          crypto.wallet.xmr.status = 'Synced';
        }

        await wallet.close();
      } catch (e) {
        if (crypto?.wallet?.xmr) {
          crypto.wallet.xmr.status = 'Network Error';
        }
      }
    };

    processBlockchain();
    return initialState;
  }

  async function backupKeys() {
    const mnemonicCode = await decrypt($identity.walletBlob);
    const text = `
# ----------------------------------------------------------------------
# SHADOWSELF - Crypto RECOVERY KIT
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

      {#if crypto.wallet[$currentCrypto].history.length === 0}
        <section id="no-funds" style="background-image: url({cart});">
          <h2 class="mt-12 text-5xl text-neutral-300">No Funds</h2>
          <p class="text-center md:w-1/2">
            No money has been transferred to this wallet and no spending has been made yet. Send some funds over and start using it
            right away!
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
                Bought Crypto at an ATM? Click
                <button class="alt px-0 py-0 text-sm" onclick={() => (($modalIndex = 0), ($mode = 'sweep'))}>Here</button> action to scan
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
            <button onclick={() => ($modalIndex = 0)}>Got it</button>
          </div>
        </Modal>
      {:else}
        <CryptoDashboard {mode} {currentCrypto} {crypto} {cryptoTitles} />
      {/if}
    {:else}
      <CryptoTransaction {mode} {crypto} {currentCrypto} {cryptoTitles} />
      <CryptoServices {mode} {crypto} {cryptoIcons} />
    {/if}
  {/await}
{:else}
  <section id="no-funds" style="background-image: url({lock});">
    <h2 class="mt-12 text-center text-5xl text-neutral-300">Encryption Key Missing</h2>
    <p class="text-center md:w-1/2">
      Your local session is missing the decryption key. Re-enter your Master Password to restore access to this identity crypto wallet.
    </p>
    <button onclick={() => ($modalIndex = 1)}>Enter Master Password</button>
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
