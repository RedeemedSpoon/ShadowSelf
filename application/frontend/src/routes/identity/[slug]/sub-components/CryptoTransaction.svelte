<script lang="ts">
  import {estimateTransactionFee, selectBestUtxos, signTransaction} from '$cryptocoin';
  import type {APIResponse, Coins, Priority, transactionData, UTXOData} from '$type';
  import {CameraIcon, CopyIcon, StackIcon} from '$icon';
  import {QrScanner, LoadingButton} from '$component';
  import {decrypt, deriveXPub} from '$cryptography';
  import {fetchIndex, identity} from '$store';
  import type {Writable} from 'svelte/store';
  import {formatUSD} from '$format';
  import {fetchAPI} from '$fetch';
  import {onMount} from 'svelte';
  import QRCode from 'qrcode';
  import {notify} from '$lib';

  import {privateKeyToAccount} from 'viem/accounts';
  import * as btc from '@scure/btc-signer';
  import {HDKey} from '@scure/bip32';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'market' | 'swap'>;
    cryptoTitles: {[key: string]: string};
    currentCrypto: Writable<Coins>;
    crypto: APIResponse;
  }

  let {mode, currentCrypto, cryptoTitles, crypto}: Props = $props();

  let index = $state(0);
  let amount = $state() as number;
  let scanning = $state(false);
  let qrImage = $state('');

  let destinationAddress = $state('');
  let selectedUtxos: UTXOData = $state([]);
  let selectedPriority: Priority = $state('low');
  let sweepStepMessage: string = $state('');

  let newUtxoWallet = $derived(!(crypto.wallet[$currentCrypto as 'btc'].nextIndex !== 0 && ['btc', 'ltc'].includes($currentCrypto)));
  const addressTitle = $derived(index === 0 ? 'Main Address' : `Derived Address (Index ${index})`);

  const estimatedFee = $derived(
    estimateTransactionFee($currentCrypto, selectedUtxos, crypto.fees[$currentCrypto][selectedPriority], amount),
  );

  const address = $derived.by(() => {
    if ($currentCrypto === 'btc' || $currentCrypto === 'ltc') {
      return deriveXPub($currentCrypto, $identity.walletKeys[$currentCrypto], index);
    } else if ($currentCrypto === 'eth' || $currentCrypto === 'usdt') {
      return $identity.walletKeys.evm;
    } else {
      return $identity.walletKeys.xmr.address;
    }
  });

  $effect(() => {
    let uri = address;
    if ($currentCrypto === 'btc') uri = `bitcoin:${address}`;
    else if ($currentCrypto === 'ltc') uri = `litecoin:${address}`;
    else if (['eth', 'usdt'].includes($currentCrypto)) uri = `ethereum:${address}`;
    else if ($currentCrypto === 'xmr') uri = `monero:${address}`;

    QRCode.toDataURL(uri, {width: 300, margin: 2}).then((url) => (qrImage = url));
  });

  function copyAddress() {
    navigator.clipboard.writeText(address);
    document.querySelector('#copied')?.classList.toggle('hidden');
    document.querySelector('#not-copied')?.classList.toggle('hidden');

    setTimeout(() => {
      document.querySelector('#not-copied')?.classList.toggle('hidden');
      document.querySelector('#copied')?.classList.toggle('hidden');
    }, 1000);
  }

  function automaticUtxoSelection() {
    if (['btc', 'ltc'].includes($currentCrypto)) {
      const currentSum = selectedUtxos.reduce((acc, u) => acc + u.value, 0);
      const targetSats = amount * 100_000_000;
      if (selectedUtxos.length > 0 && currentSum >= targetSats) return;

      const allUtxos = crypto.wallet[$currentCrypto as 'btc'].utxos;
      selectedUtxos = selectBestUtxos(allUtxos, amount, crypto.fees[$currentCrypto][selectedPriority]);
    }
  }

  function toggleUtxo(givenUtxo: UTXOData[number]) {
    const isSelected = selectedUtxos.some((utxo) => utxo.txid === givenUtxo.txid);
    if (isSelected) selectedUtxos = selectedUtxos.filter((utxo) => utxo.txid !== givenUtxo.txid);
    else selectedUtxos.push(givenUtxo);
  }

  function scanQRCode(result: string) {
    const clean = result.replace('bitcoin:', '').replace('litecoin:', '').split('?')[0];
    destinationAddress = clean;
    scanning = false;
  }

  async function sweepWallet(result: string) {
    scanning = false;
    const coin = $currentCrypto;
    let addresses: string[] = [];

    sweepStepMessage = 'Decrypting Private Key...';
    await new Promise((r) => setTimeout(r, Math.random() * 400 + 400));

    sweepStepMessage = 'Deriving Address Formats...';
    await new Promise((r) => setTimeout(r, Math.random() * 300 + 200));

    if (['btc', 'ltc'].includes(coin)) {
      const net = coin === 'btc' ? undefined : ({bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0} as any);
      const privKeyBytes = btc.WIF(net).decode(result);
      const pub = new HDKey({privateKey: privKeyBytes, chainCode: new Uint8Array(32)}).publicKey!;
      addresses = [btc.p2wpkh(pub, net).address!, btc.p2sh(btc.p2wpkh(pub, net), net).address!, btc.p2pkh(pub, net).address!];
    } else {
      addresses = [privateKeyToAccount((result.startsWith('0x') ? result : `0x${result}`) as `0x${string}`).address];
    }

    sweepStepMessage = 'Scanning Blockchain Nodes...';
    await new Promise((r) => setTimeout(r, Math.random() * 600 + 300));

    const info = await fetchAPI('crypto/sweep-info', 'POST', {coin, addresses});
    if (info.err || Number(info.balance) === 0) return notify('Wallet Empty or Invalid', 'alert');

    sweepStepMessage = 'Calculating Network Fees...';
    await new Promise((r) => setTimeout(r, Math.random() * 200 + 400));

    let amt = 0;
    let feeParam: any = 0;

    if (['btc', 'ltc'].includes(coin)) {
      const vBytes = info.utxos.length * 68 + 31 + 10;
      const feeBtc = (vBytes * crypto.fees[coin].medium) / 100_000_000;
      amt = info.balance / 100_000_000 - feeBtc;
      feeParam = {fee: feeBtc};
    } else {
      const gasPriceGwei = crypto.fees[coin].medium;
      feeParam = gasPriceGwei;

      if (coin === 'usdt') {
        amt = Number(info.balance) / 1_000_000;
      } else {
        const gasLimit = 21000;
        const feeEth = (gasLimit * gasPriceGwei) / 1_000_000_000;
        amt = Number(info.balance) / 1e18 - feeEth;
      }
    }

    sweepStepMessage = 'Cryptographically Signing...';
    await new Promise((r) => setTimeout(r, Math.random() * 600 + 500));

    const destAddr = ['btc', 'ltc'].includes(coin)
      ? deriveXPub(coin, $identity.walletKeys[coin as 'btc'], Math.max(0, crypto.wallet[coin as 'btc'].nextIndex - 1))
      : $identity.walletKeys.evm;

    const data: transactionData = {
      estimatedFee: feeParam,
      privKeyType: ['btc', 'ltc'].includes(coin) ? 'wif' : 'hex',
      wifKey: result,
      utxos: info.utxos?.map((u: any) => ({...u, pathIndex: 0})),
      nonce: info.nonce,
      balance: info.balance,
    };

    const payload = await signTransaction(coin, destAddr, amt, data);

    sweepStepMessage = 'Broadcasting to Network...';
    await new Promise((r) => setTimeout(r, Math.random() * 600 + 800));

    const response = await fetchAPI('crypto/broadcast', 'POST', payload!);
    notify(response.err || `Swept ${amt.toFixed(6)} ${coin.toUpperCase()}`, response.type);
    sweepStepMessage = '';
  }

  async function sendFunds() {
    const [addr, amt] = [String(destinationAddress).trim(), Math.max(Number(amount), 0)];
    const successMessage = `Successfully sent ${amt.toFixed(5)} ${$currentCrypto.toUpperCase()}`;

    $fetchIndex = 1;
    await new Promise((resolve) => setTimeout(resolve, 650));

    const data: transactionData = {
      estimatedFee: ['btc', 'ltc'].includes($currentCrypto) ? estimatedFee : crypto.fees[$currentCrypto][selectedPriority],
      privKeyType: 'mnemonic',
      wifKey: await decrypt($identity.walletBlob),
      index: Math.max(0, crypto.wallet[$currentCrypto as 'btc'].nextIndex - 1),
      xpubKey: $identity.walletKeys[$currentCrypto as 'btc'],
      utxos: crypto.wallet[$currentCrypto as 'btc'].utxos,
      nonce: crypto.wallet[$currentCrypto as 'eth'].nonce,
      balance: crypto.wallet[$currentCrypto as 'eth'].balance,
    };

    const broadcastPayload = await signTransaction($currentCrypto, addr, amt, data);
    if (!broadcastPayload) return;

    const response = await fetchAPI('crypto/broadcast', 'POST', broadcastPayload!);
    const announceMessage = response.err ? response.err : successMessage;
    notify(announceMessage, response.type);
    $fetchIndex = 0;
  }

  onMount(automaticUtxoSelection);
</script>

{#if $mode === 'receive'}
  <section class="flex gap-8 max-md:flex-col-reverse md:h-[400px]">
    <div class="flex flex-col justify-center gap-6 md:w-1/2">
      <div class="space-y-2">
        <h3>Receive {cryptoTitles[$currentCrypto]}</h3>
        <p class="text-sm leading-relaxed text-neutral-400">
          Scan the QR code or share the following address to receive funds.
          {#if !newUtxoWallet}
            {$currentCrypto === 'btc' ? 'Bitcoin' : 'Litecoin'} uses the <b>UTXO Protocol</b>, therefore, for better privacy, we
            recommend generating a fresh address for every transaction to prevent chain analysis from linking your payments.
            <br /><br />
            <span class="font-semibold text-amber-600">⚠️ Performance Note:</span>
            Spreading your funds across many derived addresses will increase the wallet's synchronization time. Since ShadowSelf scans the
            blockchain live, checking 15+ addresses takes significantly longer than checking one.
          {:else if $currentCrypto === 'xmr'}
            Monero uses <b>Stealth Addresses</b>. While this public address looks static, the protocol automatically generates a unique
            one-time destination for every transaction. Manual derivation is not required.
          {:else if ['eth', 'usdt'].includes($currentCrypto)}
            Ethereum uses the <b>Account Model</b>. This address is static. Unlike UTXO chains (BTC/LTC), your entire transaction
            history is permanently linked to this single public address.
          {/if}
        </p>
      </div>

      <div class="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-900/50 p-4">
        <span class="text-xs font-bold tracking-wider text-neutral-500 uppercase">{addressTitle}</span>
        <div class="flex items-center justify-between gap-2">
          <code class="text-primary-600 truncate font-mono text-sm">{address}</code>
          <button id="not-copied" class="alt mr-4 flex gap-1 px-0 py-0 text-sm" onclick={copyAddress}>
            <CopyIcon className="fill-none! w-4! h-4! mt-[2px]" />
            <span>Copy</span>
          </button>
          <button id="copied" class="alt mr-4 hidden px-0 py-0 text-sm">Copied!</button>
        </div>
      </div>

      {#if !newUtxoWallet}
        <div class="flex gap-4">
          {#if index === 0}
            <button class="w-full justify-center py-3" onclick={() => (index = crypto.wallet[$currentCrypto as 'btc'].nextIndex)}>
              Generate Fresh Address
            </button>
          {:else}
            <button class="alt w-full justify-center py-3" onclick={() => (index = 0)}>← Back to Main Address</button>
          {/if}
        </div>
      {/if}
    </div>

    <div class="flex flex-col items-center justify-center gap-4 rounded-xl p-8 md:w-1/2">
      <div class="overflow-hidden rounded-lg bg-white p-2 shadow-2xl shadow-black/50">
        <img src={qrImage} alt="Wallet Address QR" class="h-64 w-64 object-contain mix-blend-multiply" />
      </div>
      <footer class="text-xs font-medium tracking-widest text-neutral-500 uppercase">Scan with Camera</footer>
    </div>
  </section>
{:else if $mode === 'send'}
  <section class="mt-8 flex flex-col gap-6">
    <div class="flex flex-col gap-4">
      <h3>Send {cryptoTitles[$currentCrypto]}</h3>
      <div class="flex flex-col gap-1">
        <label for="amount">
          Amount in {$currentCrypto.toUpperCase()}
          <span class="text-neutral-500"
            >(1 {$currentCrypto.toUpperCase()} = {formatUSD(crypto.prices[$currentCrypto].usdPrice)})</span>
        </label>
        <input bind:value={amount} onchange={automaticUtxoSelection} type="number" name="amount" placeholder="0.00" />
      </div>

      <div class="flex flex-col gap-1">
        <label for="address">Receiver Address</label>
        <div class="flex gap-2">
          <input type="text" name="address" bind:value={destinationAddress} placeholder="Paste address here..." class="w-full" />
          <button onclick={() => (scanning = true)}><CameraIcon className="w-5 h-5" /></button>
        </div>

        {#if scanning}
          <QrScanner onScan={scanQRCode} close={() => (scanning = false)} />
        {/if}
      </div>

      <div class="flex flex-col gap-2">
        <label for="fees">Network Priority (Miner Fee)</label>
        <div class="grid grid-cols-3 gap-2">
          {#each ['low', 'medium', 'high'] as p}
            <div
              aria-hidden="true"
              class="fee-box {selectedPriority === p && 'selected'}"
              onclick={() => (selectedPriority = p as 'low')}>
              <span class="text-sm font-bold text-neutral-300 capitalize">{p}</span>
              <span class="text-xs {selectedPriority === p ? 'text-neutral-300' : 'text-neutral-500'}">
                {crypto.fees[$currentCrypto][p as 'low']}
                {['eth', 'usdt'].includes($currentCrypto) ? 'Gwei' : 'sat/vB'}
              </span>
            </div>
          {/each}
        </div>
        <small class="text-right text-xs text-neutral-500">
          Estimated Fee:
          <span class="text-neutral-300"> {estimatedFee.fee} {estimatedFee.unit} </span>
          <span>(~{formatUSD(Number(estimatedFee.fee) * crypto.prices[$currentCrypto].usdPrice)})</span>
        </small>
      </div>
    </div>

    {#if !newUtxoWallet}
      <div class="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
        <div class="mb-4">
          <h4 class="flex items-center gap-2 text-xl font-semibold text-neutral-300">
            <StackIcon className="w-8 h-8" />Coin Control<span class="text-neutral-500">(Advanced)</span>
          </h4>
          <p class="mt-1 text-sm leading-relaxed text-neutral-500">
            Manually select which UTXOs (coins) to spend. We automatically select them for you but you can update it here.
            <br />
            <span class="text-amber-600">Why?</span> Mixing coins from different sources (e.g. KYC Exchange + Private Trade) links them permanently
            on the blockchain. Keep them separate to preserve your synthetic identities.
          </p>
        </div>
        <table class="w-full text-left text-sm">
          <thead class="border-b border-neutral-800 text-xs text-neutral-500 uppercase">
            <tr>
              <th class="w-10 p-2">Select</th>
              <th class="p-2">Amount</th>
              <th class="p-2">Address Location</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-800 select-none">
            {#each crypto.wallet[$currentCrypto as 'btc'].utxos as utxo}
              <tr class="cursor-pointer hover:bg-neutral-800/40" onclick={() => toggleUtxo(utxo)}>
                <td class="p-2">
                  <input type="checkbox" checked={selectedUtxos.includes(utxo)} />
                </td>
                <td class="p-2 font-mono text-neutral-300">
                  {utxo.value / 100_000_000}
                  {$currentCrypto.toUpperCase()}
                </td>
                <td class="max-w-[250px] truncate p-2 font-mono text-xs text-neutral-500" title={utxo.address}>
                  {utxo.address}
                  <span class="ml-2 rounded bg-neutral-800 px-1 text-neutral-400">#{utxo.pathIndex}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <LoadingButton type="button" onclick={sendFunds} className="font-semibold">Sign & Broadcast Transaction</LoadingButton>
  </section>
{:else if $mode === 'sweep'}
  <div class="flex h-[40vh] items-center justify-center">
    <div class="flex w-2/3 flex-col items-center gap-3 md:w-1/2">
      <h3>Sweep {$currentCrypto.toUpperCase()} Wallet</h3>
      <p class="mb-4 text-center text-base leading-relaxed text-neutral-400">
        Sweeping imports funds from a paper wallet or private key directly into your ShadowSelf vault. We calculate the maximum
        transferable amount (minus network miner fees) and broadcast a transaction to move 100% of the assets to your main address.
        Your private key is processed locally and never leaves your browser.
      </p>
      <div>
        <LoadingButton type="button" onclick={() => (scanning = true)}>Scan Paper Wallet</LoadingButton>
        <h5 class="text-center font-mono text-sm text-neutral-500">{sweepStepMessage}</h5>
      </div>
    </div>
    {#if scanning}
      <QrScanner sweepWallet={true} onScan={sweepWallet} close={() => (scanning = false)} />
    {/if}
  </div>
{/if}

<style lang="postcss">
  @reference "$style";

  h3 {
    @apply text-3xl font-bold text-neutral-300;
  }

  label {
    @apply text-sm font-medium text-neutral-400;
  }

  .fee-box {
    @apply flex flex-col items-center justify-center transition-all duration-300 ease-in-out;
    @apply cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 hover:text-neutral-400;
  }

  .fee-box.selected {
    @apply bg-primary-600 hover:text-neutral-300;
  }

  .fee-box span {
    @apply transition-all duration-300 ease-in-out;
  }

  input[type='checkbox'] {
    @apply border-neutral-800 bg-neutral-900 focus:ring-0 focus:ring-offset-0 focus:outline-none;
    @apply checked:border-primary-600 checked:bg-primary-600 h-4 w-4 cursor-pointer rounded;
  }
</style>
