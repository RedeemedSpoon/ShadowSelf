<script lang="ts">
  import type {APIResponse, Coins, Provider, transactionData} from '$type';
  import {estimateTransactionFee, signTransaction} from '$cryptocoin';
  import {LoadingButton, SelectMenu} from '$component';
  import {decrypt, deriveXPub} from '$cryptography';
  import {onMount, type Component} from 'svelte';
  import {fetchIndex, identity} from '$store';
  import type {Writable} from 'svelte/store';
  import {formatUSD} from '$format';
  import {generatePDF} from '$pdf';
  import {fetchAPI} from '$fetch';
  import {markets} from '$market';
  import {receipt} from '$image';
  import QRCode from 'qrcode';
  import {notify} from '$lib';

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

  const coinOptions = [
    {label: 'Bitcoin', value: 'btc'},
    {label: 'Etherium', value: 'eth'},
    {label: 'Litecoin', value: 'ltc'},
    {label: 'Tether', value: 'usdt'},
    {label: 'Monero', value: 'xmr'},
  ];

  let payCoin = $state('btc');
  let receiveCoin = $state('xmr');
  let chooseProvider = $state(false);

  let swapAmount = $state(1);
  let receiveAmount = $state();
  let swapSuccess = $state(false);
  let trackingLink = $state('');

  function updateReceivedPrice() {
    const payUsdPrice = crypto.prices[payCoin as 'btc'].usdPrice * swapAmount;
    const receiveUsdPrice = crypto.prices[receiveCoin as 'btc'].usdPrice;
    receiveAmount = (payUsdPrice / receiveUsdPrice).toFixed(4);
  }

  let bestProviderIndex = $state(0);
  let selectedProviderIndex = $state(0);
  let providers: Provider[] = $state([]);
  let tradeID = $state('');

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
    const exchangeRate = crypto.prices[cryptoChoice].usdPrice;

    const cryptoDue = totalTransactionPrice / exchangeRate;

    let destAddr = $identity.walletKeys.evm;
    if (['btc', 'ltc'].includes(cryptoChoice)) {
      const xpub = $identity.walletKeys[cryptoChoice as 'btc'];
      const nextIndex = crypto.wallet[cryptoChoice as 'btc'].nextIndex;
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

  async function newRates() {
    $fetchIndex = 1;

    const response = await fetchAPI('crypto/swap-rates', 'GET', {coinFrom: payCoin, coinTo: receiveCoin, amount: swapAmount});
    if (response.err) {
      $fetchIndex = 0;
      return notify(response.err, 'alert');
    }

    tradeID = response.tradeID;
    providers = response.providers;
    selectedProviderIndex = providers.findIndex((prov) => prov.name === response.bestProvider);
    bestProviderIndex = selectedProviderIndex;

    $fetchIndex = 0;
    chooseProvider = true;
  }

  async function swap() {
    $fetchIndex = 2;

    const provider = providers[selectedProviderIndex || 0].name;
    const isFixed = providers[selectedProviderIndex || 0].isFixed;
    let destinationAddress = '';
    let refundAddress = '';

    [payCoin, receiveCoin].forEach((coin: string, i: number) => {
      let tempAddr = $identity.walletKeys.evm;

      if (coin === 'btc' || coin === 'ltc') {
        const xpub = $identity.walletKeys[coin as 'btc'];
        const nextIndex = crypto.wallet[coin as 'btc'].nextIndex;
        tempAddr = deriveXPub(coin as 'btc', xpub, nextIndex - 1);
      }

      if (i === 0) refundAddress = tempAddr;
      if (i === 1) destinationAddress = tempAddr;
    });

    const payload = {
      tradeID,
      isFixed,
      provider,
      refundAddress,
      destinationAddress,
      coinTo: receiveCoin,
      coinFrom: payCoin,
      amount: swap,
    };

    const response = await fetchAPI('crypto/swap-trades', 'POST', payload);
    if (response.err) {
      $fetchIndex = 0;
      return notify(response.err, 'alert');
    }

    try {
      const amountToSend = Number(response.depositAmount);
      const wifKey = await decrypt($identity.walletBlob);
      const feeRate = ['btc', 'ltc'].includes(payCoin) ? crypto.fees[payCoin as 'btc'].high : crypto.fees[payCoin as 'btc'].high;

      let txData: transactionData;

      if (['btc', 'ltc'].includes(payCoin)) {
        const utxos = crypto.wallet[payCoin as 'btc'].utxos;
        const feeObject = estimateTransactionFee(payCoin as Coins, utxos, feeRate, amountToSend);

        txData = {
          estimatedFee: feeObject,
          privKeyType: 'mnemonic',
          wifKey: wifKey,
          index: Math.max(0, crypto.wallet[payCoin as 'btc'].nextIndex - 1),
          xpubKey: $identity.walletKeys[payCoin as 'btc'],
          utxos: utxos,
        };
      } else {
        txData = {
          estimatedFee: feeRate,
          privKeyType: 'mnemonic',
          wifKey: wifKey,
          nonce: crypto.wallet[payCoin as 'eth'].nonce,
          balance: crypto.wallet[payCoin as 'eth'].balance,
        };
      }

      const broadcastPayload = await signTransaction(payCoin as Coins, response.depositAddress, amountToSend, txData);

      if (!broadcastPayload) {
        $fetchIndex = 0;
        return notify('Transaction signing cancelled', 'alert');
      }

      const broadcastRes = await fetchAPI('crypto/broadcast', 'POST', broadcastPayload);
      if (broadcastRes.err) throw new Error(broadcastRes.err);

      trackingLink = response.externalLink;
      swapSuccess = true;
      chooseProvider = false;
      notify(`Sent ${amountToSend} ${payCoin.toUpperCase()}`, 'success');
    } catch (e: any) {
      notify(e.message || 'Swap code execution failed, try again', 'alert');
    }

    $fetchIndex = 0;
    trackingLink = response.externalLink;
    chooseProvider = false;
    swapSuccess = true;
  }

  onMount(updateReceivedPrice);
</script>

{#if $mode === 'swap'}
  <section class="mx-auto my-8 {!chooseProvider && 'max-w-lg'} p-6">
    {#if !chooseProvider}
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-neutral-300">Swap Coins</h3>
        <p class="mt-2 text-sm leading-relaxed text-neutral-400">
          Exchange assets anonymously without KYC. All traffic is proxied through our servers to hide your identity.
        </p>
      </div>

      <div class="rounded-xl border-2 border-neutral-800 bg-neutral-950/50 p-4">
        <div class="mb-2 flex justify-between">
          <label for="from" class="text-xs font-medium text-neutral-400">
            You Pay <span class="text-neutral-600">({formatUSD(swapAmount * crypto.prices[payCoin as 'btc'].usdPrice)})</span>
          </label>
        </div>
        <div class="crypto-input flex items-center gap-4">
          <input type="number" bind:value={swapAmount} onchange={updateReceivedPrice} placeholder="0.00" />
          <SelectMenu
            name="pay"
            biggerPadding={true}
            options={coinOptions}
            fullIcons={cryptoIcons}
            value={payCoin}
            callback={(v) => ((payCoin = v), updateReceivedPrice())}
            size="small" />
        </div>
      </div>

      <div class="relative z-10 -my-2 flex justify-center">
        <div class="rounded-lg border-2 border-neutral-800 bg-neutral-900 p-2 text-neutral-400">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      <div class="rounded-xl border-2 border-neutral-800 bg-neutral-950/50 p-4">
        <div class="mb-2 flex justify-between">
          <label for="to" class="text-xs font-medium text-neutral-400">
            You Receive <span class="text-neutral-600">(Excluding Fees)</span>
          </label>
        </div>
        <div class="crypto-input flex items-center gap-4">
          <input type="number" placeholder="0.00" bind:value={receiveAmount} readonly disabled class="cursor-not-allowed" />
          <SelectMenu
            name="receive_coin"
            biggerPadding={true}
            options={coinOptions}
            fullIcons={cryptoIcons}
            value={receiveCoin}
            callback={(v) => ((receiveCoin = v), updateReceivedPrice())}
            size="small" />
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-2 text-xs text-neutral-500">
        <div class="flex justify-between">
          <span>Refund Address:</span>
          <span class="font-mono text-neutral-400">Auto-filled</span>
        </div>
        <div class="flex justify-between">
          <span>Receiving Address:</span>
          <span class="font-mono text-neutral-400">Auto-filled</span>
        </div>
      </div>

      <LoadingButton index={1} onclick={newRates} className="mt-6 w-full font-semibold">Proceed to Swap</LoadingButton>
    {:else}
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-neutral-300">Choose Provider</h3>
        <p class="mt-2 text-sm leading-relaxed text-neutral-400">
          Select a provider based on rate and privacy.
          <span class="rounded-full bg-neutral-800 px-2 py-1 font-mono">Grade A</span>
          indicates the highest privacy (No KYC/No Logs).
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 py-6 md:grid-cols-2 lg:grid-cols-3">
        {#each providers as provider, i}
          {@const costGrade = provider.costPercentage < -8 ? 'bad' : provider.costPercentage < -4 ? 'mid' : 'good'}
          <div
            aria-hidden="true"
            onclick={() => (selectedProviderIndex = i)}
            class="provider {i === selectedProviderIndex && 'selected'}">
            {#if bestProviderIndex === i}
              <div id="best-rate">
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                Best Rate
              </div>
            {/if}

            <div class="flex w-full items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-700 bg-neutral-400/20 p-1">
                  <img src={provider.logo} alt={provider.name} class="h-full w-full object-contain" />
                </div>
                <div>
                  <h4 class="font-bold text-neutral-200">{provider.name}</h4>
                  <div class="flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <span class="capitalize">{provider.isFixed ? 'Fixed Rate' : 'Floating Rate'}</span>
                    <span class="h-1 w-1 rounded-full bg-neutral-600"></span>
                    <span>~{provider.eta} mins</span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-xl font-bold tracking-tight text-neutral-300">
                  {provider.returnCoin} <span class="text-sm font-medium text-neutral-500">{receiveCoin.toUpperCase()}</span>
                </div>
                <div class="text-xs font-medium text-neutral-500">
                  ≈ {formatUSD(provider.returnUsd)} USD
                </div>
              </div>
            </div>

            <div class="flex w-full items-center justify-between border-t border-neutral-700/50 pt-3">
              <div class="flex gap-3 text-xs font-bold">
                <div class="flex items-center gap-1.5 rounded-md bg-neutral-950 px-2 py-1">
                  <span class="text-neutral-500">KYC:</span>
                  <span class={provider.kycRating}>{provider.kycRating}</span>
                </div>
                <div class="flex items-center gap-1.5 rounded-md bg-neutral-950 px-2 py-1">
                  <span class="text-neutral-500">Logs:</span>
                  <span class={provider.logPolicy}>{provider.logPolicy}</span>
                </div>
              </div>
              <div class="text-xs text-neutral-500">
                Total Cost: <span class={costGrade}>{provider.costPercentage}%</span>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-8 flex justify-evenly gap-4">
        <button onclick={() => (chooseProvider = false)} class="alt">← Back</button>
        <LoadingButton index={2} onclick={swap} className="w-1/3">Confirm Swap</LoadingButton>
      </div>
    {/if}
  </section>
{:else if $mode === 'market'}
  <section>
    <h3 class="mt-8 text-3xl font-bold text-neutral-300">Spend and Discover</h3>
    <p class="mt-2 text-sm leading-relaxed">
      We decided to keep it simple. No APIs or middlemen, just a list of places where you can spend crypto privately. Most of these are
      zero-KYC, crypto native, privacy focused and don't require even an account to use. You can find more services and product in the
      directories bellow like <a href="https://kycnot.me" id="kycme">KYCNOT.me</a>
    </p>
    <p class="mb-4 text-sm leading-relaxed text-neutral-500">
      <i>We have no affiliation or sponsorship with the services listed below. The list is updated frequently.</i>
    </p>

    <div class="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each markets as market}
        <a
          href={market.link}
          target="_blank"
          rel="noopener noreferrer"
          data-sveltekit-preload-data="tap"
          class="market-card {market.category.toLowerCase().replace(' ', '-').replace('/', '-')}">
          <div class="mb-4 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-300/10 p-1.5">
              <img
                src={market.icon}
                alt={market.name}
                class="object-contain opacity-90 {['Bitgild', 'Njalla'].includes(market.name) && 'invert'}"
                loading="lazy" />
            </div>
            <h3 class="font-bold text-neutral-300">{market.name}</h3>
          </div>
          <p class="mb-6 line-clamp-2 text-sm leading-relaxed text-neutral-400">{market.description}</p>
          <div class="flex items-center justify-between text-xs font-medium">
            <span class="tag rounded px-2 py-1 tracking-wider uppercase">{market.tag}</span>
            <span class="text-neutral-600">{market.category}</span>
          </div>
        </a>
      {/each}
    </div>

    <p class="mt-4 text-center text-sm text-neutral-500">
      Know a sovereign service we missed? <a href="/contact">Contact us</a>
      to suggest or recommend a new one.
    </p>
  </section>
{:else if $mode === 'invoice'}
  <section id="invoice" class="mt-8 flex flex-col gap-6">
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

  .crypto-input > input {
    @apply w-full bg-transparent py-3 text-2xl;
  }

  #cryptocoins button {
    @apply rounded-none bg-none shadow-none hover:bg-neutral-800/50 hover:bg-none;
    @apply cursor-pointer border border-neutral-800 bg-neutral-800/30 first:rounded-l-md last:rounded-r-md;
  }

  #cryptocoins button.selected {
    @apply bg-primary-600 text-neutral-300;
  }

  #kycme {
    @apply text-neutral-300 underline decoration-neutral-600 hover:text-neutral-400 hover:decoration-neutral-800;
  }

  .market-card {
    @apply flex flex-col justify-between rounded-xl border border-neutral-700 bg-neutral-800/20 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg;
  }

  .market-card.directories {
    @apply border-yellow-500/50 hover:border-yellow-400;
    .tag {
      @apply bg-yellow-500/20 text-yellow-300;
    }
  }

  .market-card.marketplaces {
    @apply border-fuchsia-500/50 hover:border-fuchsia-400;
    .tag {
      @apply bg-fuchsia-500/20 text-fuchsia-300;
    }
  }

  .market-card.financial-goods {
    @apply border-emerald-500/50 hover:border-emerald-400;
    .tag {
      @apply bg-emerald-500/20 text-emerald-300;
    }
  }

  .market-card.on-off-ramps {
    @apply border-blue-500/50 hover:border-blue-400;
    .tag {
      @apply bg-blue-500/20 text-blue-300;
    }
  }

  .market-card.sovereign-infrastructure {
    @apply border-red-500/50 hover:border-red-400;
    .tag {
      @apply bg-red-500/20 text-red-300;
    }
  }

  .market-card.social-identity {
    @apply border-cyan-500/50 hover:border-cyan-400;
    .tag {
      @apply bg-cyan-500/20 text-cyan-300;
    }
  }

  .provider {
    @apply relative flex min-w-[200px] cursor-pointer flex-col gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200;
    @apply border-neutral-800 bg-neutral-950/10 hover:border-neutral-700 hover:bg-neutral-950/20;
  }

  .provider.selected {
    @apply border-primary-600 shadow-primary-600/10 bg-neutral-800/80 shadow-lg;
  }

  #best-rate {
    @apply bg-primary-600 absolute -top-3 left-4 flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wide text-neutral-300 uppercase shadow-md;
  }

  .good,
  .A {
    @apply text-green-500;
  }

  .mid,
  .B {
    @apply text-orange-500;
  }

  .bad,
  .C,
  .D {
    @apply text-red-500;
  }
</style>
