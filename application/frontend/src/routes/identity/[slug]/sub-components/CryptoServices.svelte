<script lang="ts">
  import type {APIResponse, Coins} from '$type';
  import type {Writable} from 'svelte/store';
  import {deriveXPub} from '$cryptography';
  import type {Component} from 'svelte';
  import {generatePDF} from '$pdf';
  import {identity} from '$store';
  import {receipt} from '$image';
  import QRCode from 'qrcode';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'market' | 'swap'>;
    cryptoIcons: {[key: string]: Component};
    crypto: APIResponse;
  }

  let {mode, cryptoIcons, crypto}: Props = $props();

  let dueDate = $state(14);
  let logoUrl = $state('');
  let logoFiles = $state() as any;
  let clientEmail = $state('');
  let clientName = $state('');
  let useMainAddr = $state(true);
  let useNewAddr = $state(false);
  let cryptoChoice = $state('btc') as Coins;
  let pdfTableRows = $state() as HTMLTableSectionElement;

  let items = $state([{id: 1}]);
  const addItem = () => (items = [...items, {id: Date.now()}]);
  const removeItem = (index: number) => (items.length > 1 ? (items = items.filter((_, i) => i !== index)) : null);

  async function convertToPngBase64(source: File | string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      };

      img.onerror = () => resolve('');

      if (source instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => (img.src = e.target?.result as string);
        reader.readAsDataURL(source);
      } else {
        img.src = source;
      }
    });
  }

  async function gatherPDFData() {
    const {name, email} = $identity;

    const now = new Date();
    const dueObj = new Date();
    dueObj.setDate(now.getDate() + (dueDate || 0));

    const date = now.toLocaleDateString();
    const dateDue = dueObj.toLocaleDateString();
    const invoice = Math.floor(Math.random() * 1e6);

    let logoSource = logoFiles && logoFiles.length > 0 ? logoFiles[0] : logoUrl ? logoUrl : receipt;
    const logo = await convertToPngBase64(logoSource);

    if (!pdfTableRows) return;
    const tableRows = [...pdfTableRows.querySelectorAll('tr')].map((row) => {
      const descInput = row.querySelector('[name="description"]') as HTMLInputElement;
      const qtyInput = row.querySelector('[name="quantity"]') as HTMLInputElement;
      const priceInput = row.querySelector('[name="price"]') as HTMLInputElement;

      const description = descInput?.value || '';
      const quantity = Number(qtyInput?.value || 0);
      const price = Number(priceInput?.value || 0);
      const total = quantity * price;

      return {description, quantity, price, total};
    });

    const totalTransactionPrice = tableRows.reduce((sum, row) => sum + row.total, 0);
    const exchangeRate = crypto.prices[cryptoChoice].to_usd;

    const cryptoDue = totalTransactionPrice / exchangeRate;

    let destAddr = $identity.wallet_keys.evm;
    if (['btc', 'ltc'].includes(cryptoChoice)) {
      const xpub = $identity.wallet_keys[cryptoChoice as 'btc'];
      const nextIndex = crypto.wallet[cryptoChoice as 'btc'].next_index;
      const index = useMainAddr ? 0 : Math.max(0, useNewAddr ? nextIndex : nextIndex - 1);
      destAddr = deriveXPub(cryptoChoice, xpub, index);
    }

    let uri = destAddr;
    if (cryptoChoice === 'btc') uri = `bitcoin:${destAddr}?amount=${cryptoDue.toFixed(8)}`;
    else if (cryptoChoice === 'ltc') uri = `litecoin:${destAddr}?amount=${cryptoDue.toFixed(8)}`;
    else if (cryptoChoice === 'xmr') uri = `monero:${destAddr}?tx_amount=${cryptoDue.toFixed(12)}`;
    else uri = `ethereum:${destAddr}?value=${cryptoDue.toFixed(18)}`;

    const qrImage = await QRCode.toDataURL(uri, {width: 300, margin: 2});

    const identityData = {logo, name, email, invoice, date, dateDue};
    const cryptoData = {cryptoChoice, exchangeRate, cryptoDue, destAddr, qrImage};
    const tableData = {tableRows, totalTransactionPrice};
    const clientData = {clientName, clientEmail};

    generatePDF(identityData, clientData, tableData, cryptoData);
  }
</script>

{#if $mode === 'swap'}
  <h3>Swap Coins</h3>
{:else if $mode === 'market'}
  <h3>Spend & Discover</h3>
{:else if $mode === 'invoice'}
  <section id="invoice" class="flex flex-col gap-6 p-1">
    <div class="flex flex-col gap-2 border-b border-neutral-800 pb-4">
      <h3 class="text-3xl font-bold text-neutral-300">Generate PDF Invoice</h3>
      <p class="text-sm text-neutral-400">
        Create a professional, cryptographically verifiable invoice. All data is processed locally in your browser, we do not store
        your client details.
      </p>
    </div>

    <div class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label for="logo-url">(Optional) Logo URL</label>
          <div class="flex gap-2">
            <input id="logo-url" type="url" bind:value={logoUrl} disabled={logoUrl === 'File Uploaded'} placeholder="https://..." />
            <div class="relative">
              <input id="files" type="file" accept="image/*" onchange={() => (logoUrl = 'File Uploaded')} bind:files={logoFiles} />
              <button onclick={() => document.getElementById('files')?.click()} class="p-3 text-sm font-medium shadow-md">
                Upload File
              </button>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label for="due-date">Payment Due (Days)</label>
          <input id="due-date" type="number" bind:value={dueDate} placeholder="14" />
        </div>
      </div>

      <div class="my-2 rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
        <table class="w-full text-left">
          <thead class="border-b border-neutral-800 text-xs text-neutral-500 uppercase">
            <tr>
              <th class="w-[50%] pb-2">Description</th>
              <th class="w-[15%] pb-2">Qty</th>
              <th class="w-[30%] pb-2">Unit Price ($)</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-800" bind:this={pdfTableRows}>
            {#each items as _, i}
              <tr class="[&>*]:py-4 [&>*]:pr-2">
                <td><input class="bg-transparent focus:ring-1!" name="description" type="text" placeholder="Service" /></td>
                <td><input class="bg-transparent focus:ring-1!" name="quantity" type="number" value="1" /></td>
                <td><input class="bg-transparent focus:ring-1!" name="price" type="number" placeholder="0.00" /></td>
                <td class="text-right">
                  {#if items.length > 1}
                    <button onclick={() => removeItem(i)} class="from-neutral-800/50 to-neutral-800 p-2 px-3 shadow-none">✕</button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <button onclick={addItem} class="mt-3 w-full py-2 text-xs font-bold shadow-md">+ Add New Unit</button>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label for="client-name">Client Name</label>
          <input id="client-name" type="text" bind:value={clientName} placeholder="Acme Corp" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="client-email">Client Email (Optional)</label>
          <input id="client-email" type="email" bind:value={clientEmail} placeholder="billing@acme.com" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label for="crypto">Payment Method</label>
          <div id="cryptocoins">
            {#each Object.keys(cryptoIcons) as coin}
              {@const SvelteComponent = cryptoIcons[coin as Coins]}
              <button class:selected={cryptoChoice === coin} onclick={() => (cryptoChoice = coin as Coins)}>
                <div class="-mt-2 -ml-2 h-6 w-6"><SvelteComponent /></div>
              </button>
            {/each}
          </div>
        </div>
        <div class="flex flex-col justify-end gap-2">
          {#if ['btc', 'ltc'].includes(cryptoChoice)}
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <label for="main-addr">Use Main Address (Index 0)</label>
                <input id="main-addr" type="checkbox" bind:checked={useMainAddr} />
              </div>
              <div class="flex items-center justify-between {useMainAddr && 'opacity-0 select-none'}">
                <label for="new-addr">Force Fresh Address (Next Index)</label>
                <input id="new-addr" type="checkbox" disabled={useMainAddr} bind:checked={useNewAddr} />
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <button onclick={gatherPDFData}>Download Invoice PDF</button>
  </section>
{/if}

<style lang="postcss">
  @reference "$style";

  #invoice input {
    @apply h-fit w-full px-4 py-3 text-sm disabled:opacity-50;
  }

  #invoice label {
    @apply text-xs font-bold text-neutral-500 uppercase;
  }

  input[type='checkbox'] {
    @apply border-neutral-800 bg-neutral-900 focus:ring-0 focus:ring-offset-0 focus:outline-none disabled:cursor-default;
    @apply checked:border-primary-600 checked:bg-primary-600 h-4! w-4! cursor-pointer rounded p-2!;
  }

  input[type='file'] {
    @apply hidden;
  }

  #cryptocoins button {
    @apply rounded-none bg-none shadow-none hover:bg-neutral-800/50 hover:bg-none;
    @apply cursor-pointer border border-neutral-800 bg-neutral-800/30 first:rounded-l-md last:rounded-r-md;
  }

  #cryptocoins button.selected {
    @apply bg-primary-600 text-neutral-300;
  }
</style>
