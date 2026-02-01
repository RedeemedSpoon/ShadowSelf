<script lang="ts">
  import type {APIResponse, Coins, UTXOData} from '$type';
  import {CameraIcon, CopyIcon, StackIcon} from '$icon';
  import type {Writable} from 'svelte/store';
  import {deriveXPub} from '$cryptography';
  import {formatUSD} from '$format';
  import {identity} from '$store';
  import QRCode from 'qrcode';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'gift' | 'swap'>;
    cryptoTitles: {[key: string]: string};
    currentCrypto: Writable<Coins>;
    crypto: APIResponse;
  }

  let {mode, currentCrypto, cryptoTitles, crypto}: Props = $props();

  let index = $state(0);
  let qrImage = $state('');
  let selectedPriority: 'low' | 'medium' | 'high' = $state('low');
  let selectedUtxos: UTXOData = $state([]);

  let newUtxoWallet = $derived(!(crypto.wallet[$currentCrypto as 'btc'].next_index !== 0 && ['btc', 'ltc'].includes($currentCrypto)));
  const addressTitle = $derived(index === 0 ? 'Main Address' : `Derived Address (Index ${index})`);

  const address = $derived.by(() => {
    if ($currentCrypto === 'btc' || $currentCrypto === 'ltc') {
      return deriveXPub($currentCrypto, $identity.wallet_keys[$currentCrypto], index);
    } else if ($currentCrypto === 'eth' || $currentCrypto === 'usdt') {
      return $identity.wallet_keys.evm;
    } else {
      return $identity.wallet_keys.xmr.address;
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

  function toggleUtxo(given_utxo: UTXOData[number]) {
    const is_selected = selectedUtxos.some((utxo) => utxo.txid === given_utxo.txid);
    if (is_selected) selectedUtxos = selectedUtxos.filter((utxo) => utxo.txid !== given_utxo.txid);
    else selectedUtxos.push(given_utxo);
  }
  function sendFunds() {}
  function scanQRCode() {}
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
            <button class="w-full justify-center py-3" onclick={() => (index = crypto.wallet[$currentCrypto as 'btc'].next_index)}>
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
      <h3 class="text-2xl font-bold text-neutral-200">Send {cryptoTitles[$currentCrypto]}</h3>

      <div class="flex flex-col gap-1">
        <label for="amount">
          Amount in {$currentCrypto.toUpperCase()}
          <span class="text-neutral-500">(1 {$currentCrypto.toUpperCase()} = ${formatUSD(crypto.prices[$currentCrypto].to_usd)})</span>
        </label>
        <input type="number" name="amount" class="w-full" placeholder="0.00" />
      </div>

      <div class="flex flex-col gap-1">
        <label for="address">Receiver Address</label>
        <div class="flex gap-2">
          <input type="text" name="address" placeholder="Paste address here..." class="w-full" />
          <button onclick={scanQRCode}><CameraIcon className="w-5 h-5" /></button>
        </div>
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
          Estimated Fee: <span class="text-neutral-300">~ $0.00</span>
        </small>
      </div>
    </div>

    {#if !newUtxoWallet}
      <div class="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
        <div class="mb-4">
          <h4 class="flex items-center gap-2 text-lg font-semibold text-neutral-300">
            <StackIcon className="w-7 h-7" />Coin Control<span class="text-neutral-500">(Advanced)</span>
          </h4>
          <p class="mt-1 text-xs leading-relaxed text-neutral-500">
            Manually select which UTXOs (coins) to spend.
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
                  <span class="ml-2 rounded bg-neutral-800 px-1 text-neutral-400">#{utxo.path_index}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <button class="font-semibold" onclick={sendFunds}>Sign & Broadcast Transaction</button>
  </section>
{:else if $mode === 'sweep'}
  <h3>Sweep Wallet</h3>
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
