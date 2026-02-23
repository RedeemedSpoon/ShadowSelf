<script lang="ts">
  import {BoltIcon, HashIcon, ChartIcon, StackIcon, ActivityIcon, BroadcastIcon, GasStationIcon, ClockIcon} from '$icon';
  import {UpArcIcon, DownArcIcon, ExternalLinkIcon, CameraIcon, WalletIcon, BroomIcon, SpreadSheetIcon} from '$icon';
  import type {APIResponse, Coins} from '$type';
  import {formatUSD, formatDate} from '$format';
  import {identity, moneroData} from '$store';
  import type {Writable} from 'svelte/store';
  import {deriveXPub} from '$cryptography';
  import {CopyButton} from '$component';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'market' | 'swap'>;
    cryptoTitles: {[key: string]: string};
    currentCrypto: Writable<Coins>;
    crypto: APIResponse;
  }

  let {cryptoTitles, currentCrypto, crypto, mode}: Props = $props();

  let anchor = $state() as HTMLAnchorElement;
  const filename = $derived(`ShadowSelf-${$currentCrypto.toUpperCase()}-Transaction-History.csv`);

  const balance: number = $derived(crypto.wallet[$currentCrypto].balance);
  const usdBalance: number = $derived(balance * crypto.prices[$currentCrypto].usdPrice);
  const statusClass: string = $derived(crypto.wallet[$currentCrypto].status.toLowerCase().replaceAll(' ', '-'));
  const growthClass: string = $derived(crypto.prices[$currentCrypto].dailyChange > 0 ? 'up' : 'down');

  const activePaths = $derived(
    (() => {
      const isDerivable = ['btc', 'ltc'].includes($currentCrypto);
      return isDerivable ? crypto.wallet[$currentCrypto as 'btc'].activeCount : 0;
    })(),
  );

  const externalUrl = $derived(
    (() => {
      switch ($currentCrypto) {
        case 'btc':
          return 'https://mempool.space/tx/';
        case 'ltc':
          return 'https://litecoinspace.org/tx/';
        case 'eth':
          return 'https://eth.blockscout.com/tx/';
        case 'usdt':
          return 'https://eth.blockscout.com/tx/';
        case 'xmr':
          return 'https://moneroblocks.info/tx/';
      }
    })(),
  );

  const rate = $derived(crypto.fees[$currentCrypto].medium);
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
      const price = crypto.prices[$currentCrypto === 'usdt' ? 'eth' : $currentCrypto]?.usdPrice || 0;
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
      const w = crypto.wallet[$currentCrypto] as any;
      if (['btc', 'ltc'].includes($currentCrypto)) return w.utxos.length;
      if (['eth', 'usdt'].includes($currentCrypto)) return w.nonce;
      return null;
    })(),
  );

  const intelDisplay = $derived(
    (() => {
      if ($currentCrypto === 'xmr') {
        const w = crypto.wallet.xmr;
        const locked = w.balance - w.unlockedBalance;

        if (locked > 0) return {label: 'Locked Coins', value: `${locked.toFixed(4)} XMR`, percentile: 'Active'};
        else return {label: 'Spendable Coins', value: '100%', percentile: 'Max'};
      }

      if (['btc', 'ltc'].includes($currentCrypto)) {
        if (intelRaw === 0) return {label: 'UTXOs', value: intelRaw, percentile: 'Empty'};
        if ((intelRaw as number) <= 5) return {label: 'UTXOs', value: intelRaw, percentile: 'Optimized'};
        if ((intelRaw as number) <= 15) return {label: 'UTXOs', value: intelRaw, percentile: 'Fragmented'};
        return {label: 'UTXOs', value: intelRaw, percentile: 'Bloated'};
      } else if (['eth', 'usdt'].includes($currentCrypto)) {
        if (intelRaw === 0) return {label: 'Nonce', value: intelRaw, percentile: 'Fresh'};
        return {label: 'Nonce', value: intelRaw, percentile: 'Active'};
      }
    })(),
  );

  const weeklyGrowth: number = $derived(
    (() => {
      const currentPrice = crypto.prices[$currentCrypto].usdPrice;
      const price7dAgo = crypto.prices[$currentCrypto].chart[0];
      return ((currentPrice - price7dAgo) / price7dAgo) * 100;
    })(),
  );

  function copyCounterparty(counterparty: string) {
    navigator.clipboard.writeText(counterparty);
    const element = document.querySelector(`#counterparty-${counterparty}`) as HTMLTableCellElement;
    element.innerText = 'Copied to clipboard!            '; // Intentional Space
    setTimeout(() => (element.innerText = counterparty), 1000);
  }

  function toggleDustTransactions() {
    const excludeTransactionIndexes = [] as number[];
    const tableElements = document.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>;

    const transactionHistory = crypto.wallet[$currentCrypto].history;
    const usdDustThreshold = 1.0;

    for (const i in transactionHistory) {
      const transactionAmount = transactionHistory[i].amount;
      const currentCryptoPrice = crypto.prices[$currentCrypto].usdPrice;
      const usdtransactionAmount = transactionAmount * currentCryptoPrice;

      if (usdtransactionAmount < usdDustThreshold) {
        excludeTransactionIndexes.push(Number(i));
      }
    }

    for (const i of excludeTransactionIndexes) {
      tableElements[i].classList.toggle('hidden');
    }
  }

  function exportCSV() {
    const transactionHistory = crypto.wallet[$currentCrypto].history;
    let csv = 'Date,Type,Amount,Counterparty,TXID';

    for (const t of transactionHistory) {
      const row = [new Date(t.date).toISOString(), t.type, t.amount, t.counterparty, t.txid];
      csv += '\n' + row.join(',');
    }

    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    anchor.href = URL.createObjectURL(blob);
    anchor.click();
  }
</script>

<section class="my-6">
  <div id="top-section" class="-mb-10 flex justify-between">
    <div id="left-section" class="w-2/3">
      <p>
        <b><WalletIcon className="w-6! h-6! mt-2 cursor-default" />Balance:</b>{balance}
        {$currentCrypto.toUpperCase()} <span class="text-neutral-500">({formatUSD(usdBalance)})</span>
      </p>
      <p class="w-1/2">
        <b><HashIcon />{activePaths !== 0 ? 'Main ' : ''}Address:</b>
        {#if $currentCrypto === 'btc'}
          {@const btc = deriveXPub('btc', $identity.walletKeys.btc, 0)}
          <CopyButton otherAlt={true} className={'-my-3!'} alt={true} label={`${btc.slice(0, 20)}...`} text={btc} />
          <span class="self-center text-xs whitespace-nowrap text-neutral-500" title="{activePaths} Derived Addresses Used"
            >({activePaths} active)</span>
        {:else if $currentCrypto === 'ltc'}
          {@const ltc = deriveXPub('ltc', $identity.walletKeys.ltc, 0)}
          <CopyButton otherAlt={true} className={'-my-3!'} alt={true} label={`${ltc.slice(0, 20)}...`} text={ltc} />
          <span class="self-center text-xs whitespace-nowrap text-neutral-500" title="{activePaths} Derived Addresses Used"
            >({activePaths} active)</span>
        {:else if $currentCrypto === 'xmr'}
          {@const xmr = $moneroData.address}
          <CopyButton otherAlt={true} className={'-my-3!'} alt={true} label={`${xmr.slice(0, 20)}...`} text={xmr} />
        {:else}
          {@const eth = $identity.walletKeys.evm}
          <CopyButton otherAlt={true} className={'-my-3!'} alt={true} text={eth} label={`${eth.slice(0, 20)}...`} />
        {/if}
      </p>
      <p>
        <b><ActivityIcon />Growth (24h):</b>
        <span class={growthClass}>{growthClass === 'up' ? '↗' : '↘'} {crypto.prices[$currentCrypto].dailyChange.toFixed(2)}%</span>
      </p>
      <div class="w-3/4">
        <div class="mt-4 flex items-end justify-between">
          <h3 class="text-primary-600 flex gap-x-1.5 text-2xl font-semibold">
            <ChartIcon />Price Chart <span class="text-lg text-neutral-500">(last 7 days)</span>
          </h3>
          <a class="group flex gap-1" href="https://www.coingecko.com/en/coins/{cryptoTitles[$currentCrypto].toLowerCase()}">
            More Metrics <ExternalLinkIcon
              className={'w-4! h-4! transition-colors duration-300 stroke-primary-600 group-hover:stroke-primary-700'} />
          </a>
        </div>
        <div class="mb-6">
          <h3>
            {$currentCrypto.toUpperCase()}/USD
            <span class="text-xl text-neutral-200">{formatUSD(crypto.prices[$currentCrypto].usdPrice)}</span>
            <span class={weeklyGrowth > 0 ? 'up' : 'down'}>{weeklyGrowth > 0 ? '↗' : '↘'} {weeklyGrowth.toFixed(2)}%</span>
          </h3>
        </div>
        <div id="chart" class="text-primary-600 relative h-76 w-full">
          {#if crypto.prices[$currentCrypto].chart}
            {@const data = crypto.prices[$currentCrypto].chart}
            {@const min = Math.min(...data)}
            {@const max = Math.max(...data)}
            {@const mid = (max + min) / 2}
            {@const range = max - min || 1}

            {@const points = data
              .map((price, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 80 - ((price - min) / range) * 75;
                return `${x},${y}`;
              })
              .join(' ')}

            <div class="top-0 border-neutral-400/75"></div>
            <div class="top-[20%] border-neutral-400/25"></div>
            <div class="top-[40%] border-neutral-400/25"></div>
            <div class="top-[60%] border-neutral-400/25"></div>
            <div class="top-[80%] border-neutral-400/75"></div>

            <p class="-top-3">{formatUSD(max)}</p>
            <p class="top-[37%]">{formatUSD(mid)}</p>
            <p class="top-[77%]">{formatUSD(min)}</p>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 z-10 h-full w-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="currentColor" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path d={`M 0,80 L ${points} L 100,80 Z`} fill="url(#chartGradient)" stroke="none" />
              <polyline
                {points}
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                vector-effect="non-scaling-stroke"
                stroke-linejoin="round"
                stroke-linecap="round" />
            </svg>
          {/if}
        </div>
      </div>
    </div>
    <div id="right-section" class="w-1/3">
      <p>
        <b><GasStationIcon />Fees:</b><span class={feesPercentile.toLowerCase()}>{feesPercentile}</span>
        {#if $currentCrypto !== 'xmr'}
          <span class="text-neutral-500">({crypto.fees[$currentCrypto].medium} {feesLabel} or {feesUsd})</span>
        {:else}
          <span class="text-neutral-500">({feesUsd})</span>
        {/if}
      </p>
      <p><b><BroadcastIcon />Status:</b><span class={statusClass}>{crypto.wallet[$currentCrypto].status}</span></p>
      <p>
        <b><StackIcon />{intelDisplay!.label}:</b>{intelDisplay!.value}
        <span class={intelDisplay!.percentile.toLowerCase()}>({intelDisplay!.percentile.trim()})</span>
      </p>
      <h3 class="text-primary-600 my-4 flex gap-x-1.5 text-2xl font-semibold"><BoltIcon />Quick Actions</h3>
      <div id="action-buttons" class="flex w-4/5 flex-col gap-y-4">
        <button onclick={() => ($mode = 'send')}><UpArcIcon />Send {cryptoTitles[$currentCrypto]}</button>
        <button onclick={() => ($mode = 'receive')}><DownArcIcon />Receive {cryptoTitles[$currentCrypto]}</button>
        <button onclick={() => ($mode = 'sweep')}><CameraIcon />Sweep {$currentCrypto.toUpperCase()} Paper Wallet</button>
      </div>
    </div>
  </div>
  <div id="bottom-section">
    <div class="flex justify-between">
      <a bind:this={anchor} aria-label="Download" href="/" download={filename} class="hidden"></a>
      <h3 class="text-primary-600 my-4 flex gap-x-1.5 text-2xl font-semibold"><ClockIcon />Transaction History</h3>
      <div id="table-actions" class="flex items-center gap-x-2">
        <button onclick={toggleDustTransactions}><BroomIcon />Toggle Dust Transactions</button>
        <div class="font-bold text-neutral-500 select-none">|</div>
        <button onclick={exportCSV}><SpreadSheetIcon />Export to CSV</button>
      </div>
    </div>
    <table class="w-full border-collapse border border-neutral-800 bg-neutral-900/20 text-left text-sm">
      <thead class="bg-neutral-900/80 text-xs font-medium tracking-wider text-neutral-500 uppercase">
        <tr>
          <th>Type</th>
          <th>Amount</th>
          <th>Date</th>
          <th>To/From</th>
          <th>TXID</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-neutral-800">
        {#each crypto.wallet[$currentCrypto].history as transaction}
          <tr class="transition-colors hover:bg-neutral-800/40">
            <td class="text-xs font-bold tracking-wide uppercase {transaction.type}">{transaction.type}</td>
            <td class="font-medium text-neutral-300">{transaction.amount}</td>
            <td class="whitespace-nowrap text-neutral-400">{formatDate(new Date(transaction.date).toString())}</td>
            <td
              id="counterparty-{transaction.counterparty}"
              class="max-w-[200px] cursor-pointer font-mono font-medium text-neutral-300"
              onclick={() => copyCounterparty(transaction.counterparty)}
              title={transaction.counterparty}>
              {transaction.counterparty}</td>
            <td class="max-w-[120px] font-mono text-neutral-500" title={transaction.txid}>
              <a target="_blank" href={externalUrl + transaction.txid} class="group flex">
                {transaction.txid.slice(0, 15)}...<ExternalLinkIcon
                  className="h-3.5! w-3.5! stroke-primary-600 group-hover:stroke-primary-700 transition-colors duration-300" /></a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <small class="mt-2 flex w-full justify-center text-neutral-500">Showing the latest 50 Transactions</small>
  </div>
</section>

<style lang="postcss">
  @reference "$style";

  #left-section p,
  #right-section p {
    @apply flex gap-2 text-neutral-300;
  }

  #action-buttons button {
    @apply flex gap-2 from-neutral-800/50 to-neutral-700/50 font-semibold shadow-neutral-900 hover:shadow-neutral-950;
  }

  #table-actions button {
    @apply alt flex items-center gap-1 px-0 py-0 text-lg font-semibold;
  }

  b {
    @apply text-primary-600 flex gap-x-1.5 whitespace-nowrap;
  }

  thead th {
    @apply border-b border-neutral-800 px-6 py-3;
  }

  td {
    @apply truncate px-6 py-4;
  }

  #chart > div {
    @apply absolute right-0 left-0 border-t-2;
  }

  #chart > p {
    @apply absolute right-0 bg-neutral-900 px-1 font-mono text-xs text-neutral-500;
  }

  .up,
  .max,
  .fresh,
  .synced,
  .optimized,
  .network-operational,
  .received,
  .low {
    @apply text-green-600;
  }

  .fragmented,
  .active,
  .avg {
    @apply text-amber-600;
  }

  .down,
  .network-error,
  .bloated,
  .sent,
  .high {
    @apply text-red-600;
  }
</style>
