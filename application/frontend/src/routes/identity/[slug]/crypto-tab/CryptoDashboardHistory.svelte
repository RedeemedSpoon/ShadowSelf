<script lang="ts">
  import type {CryptoAPI, Coins} from '$type';
  import type {Writable} from 'svelte/store';
  import {formatDate} from '$utils/formating';
  import {EXTERNAL_TX_VIEWERS} from '$constant';

  import ClockIcon from '$icon/data/Clock.svelte';
  import BroomIcon from '$icon/misc/Broom.svelte';
  import ExternalLinkIcon from '$icon/navigation/ExternalLink.svelte';
  import SpreadSheetIcon from '$icon/data/SpreadSheet.svelte';

  interface Props {
    currentCrypto: Writable<Coins>;
    crypto: CryptoAPI;
  }

  let {currentCrypto, crypto}: Props = $props();

  let anchor = $state() as HTMLAnchorElement;
  const filename = $derived(`ShadowSelf-${$currentCrypto.toUpperCase()}-Transaction-History.csv`);
  const externalUrl = $derived(EXTERNAL_TX_VIEWERS[$currentCrypto as keyof typeof EXTERNAL_TX_VIEWERS]);

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
            class="max-w-50 cursor-pointer font-mono font-medium text-neutral-300"
            onclick={() => copyCounterparty(transaction.counterparty)}
            title={transaction.counterparty}>
            {transaction.counterparty}</td>
          <td class="max-w-30 font-mono text-neutral-500" title={transaction.txid}>
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

<style lang="postcss">
  @reference "$style";

  #table-actions button {
    @apply alt flex items-center gap-1 px-0 py-0 text-lg font-semibold;
  }

  thead th {
    @apply border-b border-neutral-800 px-6 py-3;
  }

  td {
    @apply truncate px-6 py-4;
  }

  .received {
    @apply text-green-600;
  }

  .sent {
    @apply text-red-600;
  }
</style>
