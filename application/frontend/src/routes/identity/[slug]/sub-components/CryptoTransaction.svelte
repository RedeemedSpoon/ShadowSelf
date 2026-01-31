<script lang="ts">
  import {deriveXPub} from '$lib/utils/cryptography';
  import type {APIResponse, Coins} from '$type';
  import type {Writable} from 'svelte/store';
  import {identity} from '$store';
  import {CopyIcon} from '$icon';
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
    QRCode.toDataURL(address, {width: 300, margin: 2}).then((url) => (qrImage = url));
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
</script>

{#if $mode === 'receive'}
  <section class="flex gap-8 max-md:flex-col-reverse md:h-[400px]">
    <div class="flex flex-col justify-center gap-6 md:w-1/2">
      <div class="space-y-2">
        <h3 class="text-3xl font-bold text-neutral-300">Receive {cryptoTitles[$currentCrypto]}</h3>
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
  <h3>Send Payment</h3>
  <!-- <p>ETH/USDT REGULAR</p> -->
  <!-- <p>UTXO BTC/LTC</p> -->
  <!-- <p>LAST USED ADDRESS BTC/LTC</p> -->
  <!-- <p>FEE CALCULATION</p> -->
  <!-- <p>PRIORITY MODES</p> -->
  <!-- <p>JOB/SIGN LOCAL BROWSER</p> -->
{:else if $mode === 'sweep'}
  <h3>Sweep Wallet</h3>
{/if}
