<script lang="ts">
  import {onMount} from 'svelte';
  import {get} from 'svelte/store';
  import {vaultKey, moneroData} from '$store';
  import {request} from '$utils/webfetch';
  import {decrypt} from '$utils/cryptography';
  import initMoneroScan, {idbOperation} from '$utils/monero';
  import type {FullIdentity, CryptoAPI, Coins, MoneroNodeAPI} from '$type';
  import {formatUSD} from '$utils/formatting';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Icon from '$component/ui/Icon.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import WalletTransfer from './WalletTransfer.svelte';
  import WalletReceive from './WalletReceive.svelte';
  import WalletSwap from './WalletSwap.svelte';
  import WalletInvoice from './WalletInvoice.svelte';
  import WalletMarket from './WalletMarket.svelte';

  let {account, onunlock}: {account: FullIdentity; onunlock: () => void} = $props();
  let crypto = $state<CryptoAPI | null>(null);
  let coin = $state<Coins>('btc');
  let mode = $state('overview');
  let pending = $state(false);
  let syncing = $state(false);
  let error = $state('');
  let progress = $state(0);
  let backup = $state('');
  let abort: AbortController;
  const names = {btc: 'Bitcoin', ltc: 'Litecoin', eth: 'Ethereum', usdt: 'Tether', xmr: 'Monero'};
  const chartPoints = $derived.by(() => {
    const values = crypto?.prices[coin].chart.filter(Number.isFinite) || [];

    if (values.length < 2) {
      return '';
    }

    const minimum = Math.min(...values);
    const range = Math.max(...values) - minimum || 1;

    return values.map((value, index) => `${(index / (values.length - 1)) * 600},${105 - ((value - minimum) / range) * 90}`).join(' ');
  });
  const history = $derived(crypto?.wallet[coin]?.history || []);

  $effect(() => {
    if (!$vaultKey) {
      backup = '';
      abort?.abort();
      syncing = false;
    }
  });

  async function load() {
    pending = true;
    error = '';

    const result = await request<CryptoAPI>(`/identities/${account.id}/wallet`);
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    crypto = {
      ...result.data,
      wallet: {
        ...result.data.wallet,
        xmr: crypto?.wallet.xmr || {
          status: 'Not synced',
          startingDate: new Date(account.creationDate),
          nodeUrl: '',
          balance: 0,
          unlockedBalance: 0,
          history: [],
        },
      },
    };
  }

  async function sync() {
    if (!$vaultKey) {
      return;
    }

    syncing = true;
    error = '';
    progress = 0;
    abort?.abort();
    abort = new AbortController();

    const key = get(vaultKey);
    const operation = abort;

    try {
      const node = await request<MoneroNodeAPI>(`/identities/${account.id}/wallet/node`);

      if (!node.ok) {
        throw new Error(node.error);
      }

      const [address, viewKey, spendKey] = await Promise.all([
        decrypt(account.walletKeys.xmr.address, key!),
        decrypt(account.walletKeys.xmr.viewKey, key!),
        decrypt(account.walletKeys.xmr.spendKey, key!),
      ]);

      if (operation.signal.aborted || get(vaultKey) !== key) {
        return;
      }

      if (!address || !viewKey || !spendKey) {
        throw new Error('Monero keys could not be unlocked.');
      }

      moneroData.set({address, viewKey, spendKey});

      const initial = await initMoneroScan(
        node.data,
        () => {},
        (value) => {
          if (!operation.signal.aborted) {
            progress = value;
          }
        },
        (result) => {
          if (operation.signal.aborted || get(vaultKey) !== key) {
            return;
          }

          if (crypto) {
            crypto.wallet.xmr = {...crypto.wallet.xmr, ...result};
          }

          syncing = false;
        },
        () => {
          if (operation.signal.aborted) {
            return;
          }

          error = 'Monero sync failed. Retry or clear the encrypted browser cache.';
          syncing = false;
        },
        operation.signal,
      );

      if (!operation.signal.aborted && get(vaultKey) === key && crypto) {
        crypto.wallet.xmr = {...crypto.wallet.xmr, ...initial};
      }
    } catch (cause) {
      if (!operation.signal.aborted) {
        error = cause instanceof Error ? cause.message : 'Could not sync Monero.';
        syncing = false;
      }
    }
  }

  async function clearCache() {
    abort?.abort();
    await idbOperation('delete', `${account.id}:${account.walletBlob}`);
    syncing = false;
    error = '';
  }

  async function showBackup() {
    try {
      const key = get(vaultKey);

      if (!key) {
        return;
      }

      const value = await decrypt(account.walletBlob, key);

      if (get(vaultKey) === key) {
        backup = value;
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not reveal the recovery phrase.';
    }
  }

  onMount(() => {
    void load();

    return () => {
      abort?.abort();
      backup = '';
    };
  });
</script>

<div class="section-heading">
  <div>
    <h2>Crypto wallet</h2>
  </div>
  <div class="button-row">
    <Button variant="quiet" onclick={() => (mode = mode === 'markets' ? 'overview' : 'markets')}>{mode === 'markets' ? 'Back to wallet' : 'Markets'}</Button
    ><Button variant="secondary" icon="refresh" loading={pending} onclick={load}>Refresh</Button>
  </div>
</div>
<Status message={error} kind="error" />
{#if mode === 'markets'}<WalletMarket />{:else if !crypto}<div class="empty-state">
    <Icon name="wallet" size={40} />
    <h2>{pending ? 'Loading wallet' : 'Wallet data unavailable'}</h2>
    {#if !pending}<Button variant="secondary" onclick={load}>Retry wallet providers</Button>{/if}
  </div>
{:else}<div class="coin-grid">
    {#each Object.entries(names) as [ticker, name] (ticker)}<button
        class:active={coin === ticker}
        onclick={() => {
          coin = ticker as Coins;
          mode = 'overview';
        }}
        ><span>{ticker.toUpperCase()}<small>{name}</small></span><strong
          >{crypto.wallet[ticker as Coins].status === 'Synced' || ticker !== 'xmr'
            ? crypto.wallet[ticker as Coins].balance.toLocaleString(undefined, {maximumFractionDigits: 8})
            : 'Not synced'}</strong
        ><small
          >{ticker === 'xmr' && crypto.wallet.xmr.status !== 'Synced'
            ? 'Unlock to sync'
            : formatUSD(crypto.wallet[ticker as Coins].balance * crypto.prices[ticker as Coins].usdPrice)}</small
        ></button
      >{/each}
  </div>
  <div class="tabs" aria-label="Wallet actions">
    {#each ['overview', 'receive', 'send', 'sweep', 'swap', 'invoice', 'markets'] as action (action)}{#if !(coin === 'xmr' && action === 'sweep')}<button
          class:active={mode === action}
          onclick={() => (mode = action)}>{action[0].toUpperCase() + action.slice(1)}</button
        >{/if}{/each}
  </div>
  {#if coin === 'xmr'}<div class="panel monero-sync">
      <div>
        <h3>Monero browser wallet</h3>
        <p>{syncing ? `Scanning blockchain · ${progress}%` : crypto.wallet.xmr.status}</p>
      </div>
      <div class="button-row">
        <Button loading={syncing} disabled={!$vaultKey} onclick={sync}>Sync Monero</Button><Button variant="quiet" disabled={syncing} onclick={clearCache}
          >Clear local cache</Button>
      </div>
    </div>{/if}
  {#key coin}
    {#if mode === 'overview'}
      <section class="panel price-panel">
        <div class="section-heading">
          <div>
            <h3>{names[coin]} market price</h3>
            <p>{formatUSD(crypto.prices[coin].usdPrice)} USD per {coin.toUpperCase()}</p>
          </div>
          <span class="badge">{crypto.prices[coin].dailyChange.toFixed(2)}% · 24h</span>
        </div>
        {#if chartPoints}<svg viewBox="0 0 600 120" role="img" aria-label="Seven-day {names[coin]} price history"
            ><polyline points={chartPoints} fill="none" stroke="#a496f4" stroke-width="2" vector-effect="non-scaling-stroke" /></svg
          >{:else}<p>No seven-day price history was returned.</p>{/if}
      </section>
      <section class="panel">
        <div class="section-heading">
          <div>
            <h3>{names[coin]} transactions</h3>
            {#if coin === 'xmr' && crypto.wallet.xmr.status !== 'Synced'}<p>Sync Monero to load transaction history.</p>{/if}
          </div>
          <span class="badge">{crypto.wallet[coin].status}</span>
        </div>
        {#if !history.length}<div class="empty-state">
            <Icon name="wallet" size={32} />
            <p>No transactions reported.</p>
          </div>{:else}<div class="transaction-list">
            {#each history as transaction (transaction.txid)}<div>
                <span>{transaction.type}<small>{new Date(transaction.date).toLocaleString()}</small></span><span>{transaction.amount} {coin.toUpperCase()}</span
                ><code>{transaction.txid.slice(0, 12)}…</code>
              </div>{/each}
          </div>{/if}
      </section>
    {:else if mode === 'receive'}<WalletReceive {account} {coin} {crypto} />{:else if mode === 'invoice'}<WalletInvoice
        {account}
        {coin}
        {crypto} />{:else if mode === 'swap'}<WalletSwap {account} {coin} />{:else if !$vaultKey}<div class="empty-state">
        <Icon name="lock" size={40} />
        <h2>Wallet locked</h2>
        <p>Signing requires this identity's master password.</p>
        <Button icon="key" onclick={onunlock}>Unlock wallet</Button>
      </div>{:else}<WalletTransfer {account} {coin} {crypto} sweep={mode === 'sweep'} oncomplete={load} />{/if}
  {/key}
  <section class="panel backup-panel">
    <div class="section-heading">
      <div>
        <h3>Recovery phrase</h3>
      </div>
      <Button variant="quiet" disabled={!$vaultKey} onclick={() => (backup ? (backup = '') : showBackup())}>{backup ? 'Hide phrase' : 'Reveal phrase'}</Button>
    </div>
    {#if backup}<Status message="Anyone with this phrase can spend these wallet funds. Store it offline." /><Copy value={backup} label="Copy phrase" />{/if}
  </section>{/if}

<style>
  .price-panel svg {
    display: block;
    width: 100%;
    height: 140px;
  }
  .coin-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 22px;
  }
  .coin-grid button {
    min-width: 0;
    text-align: left;
    padding: 16px 13px;
    border: 1px solid #a5b4fc20;
    border-radius: 6px;
    background: #10192a;
    color: #c7d1e8;
  }
  .coin-grid button.active {
    border-color: #9c8ff075;
    background: #6353eb12;
  }
  .coin-grid button > span {
    font-size: 12px;
    color: #bbb2ff;
    display: block;
  }
  .coin-grid small {
    font-size: 9px;
    display: block;
    color: #70809b;
    margin-top: 4px;
  }
  .coin-grid strong {
    display: block;
    font-size: 15px;
    font-weight: 500;
    margin-top: 15px;
    overflow-wrap: anywhere;
  }
  .monero-sync {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: center;
    margin-bottom: 18px;
  }
  .transaction-list > div {
    display: flex;
    gap: 20px;
    justify-content: space-between;
    padding: 15px 0;
    border-bottom: 1px solid #a5b4fc16;
    font-size: 12px;
  }
  .transaction-list small {
    display: block;
    margin-top: 5px;
  }
  .transaction-list code {
    font-size: 10px;
    color: #7788a6;
  }
  .backup-panel {
    margin-top: 20px;
  }
  @media (max-width: 800px) {
    .price-panel svg {
      display: block;
      width: 100%;
      height: 140px;
    }
    .coin-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .monero-sync {
      flex-wrap: wrap;
    }
    .transaction-list > div {
      flex-wrap: wrap;
    }
    .backup-panel .section-heading {
      flex-wrap: wrap;
    }
  }
  @media (max-width: 450px) {
    .price-panel svg {
      display: block;
      width: 100%;
      height: 140px;
    }
    .coin-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
