<script lang="ts">
  import {estimateTransactionFee, selectBestUtxos} from '$fees';
  import type {APIResponse, Coins, UTXOData} from '$type';
  import {CameraIcon, CopyIcon, StackIcon} from '$icon';
  import {decrypt, deriveXPub} from '$cryptography';
  import type {Writable} from 'svelte/store';
  import {QrScanner} from '$component';
  import {formatUSD} from '$format';
  import {identity} from '$store';
  import {fetchAPI} from '$fetch';
  import {onMount} from 'svelte';
  import QRCode from 'qrcode';
  import {notify} from '$lib';

  import {createWalletClient, http, parseEther, parseUnits, encodeFunctionData, isAddress} from 'viem';
  import {mnemonicToAccount} from 'viem/accounts';
  import * as btc from '@scure/btc-signer';
  import * as bip39 from '@scure/bip39';
  import {mainnet} from 'viem/chains';
  import {HDKey} from '@scure/bip32';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'gift' | 'swap'>;
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
  let selectedPriority: 'low' | 'medium' | 'high' = $state('low');

  let newUtxoWallet = $derived(!(crypto.wallet[$currentCrypto as 'btc'].next_index !== 0 && ['btc', 'ltc'].includes($currentCrypto)));
  const addressTitle = $derived(index === 0 ? 'Main Address' : `Derived Address (Index ${index})`);

  const estimatedFee = $derived(
    estimateTransactionFee($currentCrypto, selectedUtxos, crypto.fees[$currentCrypto][selectedPriority], amount),
  );

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

  function automaticUtxoSelection() {
    if (['btc', 'ltc'].includes($currentCrypto)) {
      const currentSum = selectedUtxos.reduce((acc, u) => acc + u.value, 0);
      const targetSats = amount * 100_000_000;
      if (selectedUtxos.length > 0 && currentSum >= targetSats) return;

      const allUtxos = crypto.wallet[$currentCrypto as 'btc'].utxos;
      selectedUtxos = selectBestUtxos(allUtxos, amount, crypto.fees[$currentCrypto][selectedPriority]);
    }
  }

  function toggleUtxo(given_utxo: UTXOData[number]) {
    const is_selected = selectedUtxos.some((utxo) => utxo.txid === given_utxo.txid);
    if (is_selected) selectedUtxos = selectedUtxos.filter((utxo) => utxo.txid !== given_utxo.txid);
    else selectedUtxos.push(given_utxo);
  }

  function scanQRCode(result: string) {
    const clean = result.replace('bitcoin:', '').replace('litecoin:', '').split('?')[0];
    destinationAddress = clean;
    scanning = false;
  }

  async function sendFunds() {
    const [addr, amt] = [String(destinationAddress).trim(), Math.max(Number(amount), 0)];

    if (!addr || addr.length < 10) return notify('Invalid Receiver Address', 'alert');
    if (amt <= 0) return notify('Amount must be greater than 0', 'alert');

    let broadcastPayload = {coin: $currentCrypto, hex: ''};
    const successMessage = `Successfully sent ${amt.toFixed(5)} ${$currentCrypto.toUpperCase()}`;
    const mnemonicCode = await decrypt($identity.wallet_blob);

    try {
      if (['btc', 'ltc'].includes($currentCrypto)) {
        const isBtc = $currentCrypto === 'btc';
        const netParam = isBtc ? undefined : ({bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0} as any);

        const seed = await bip39.mnemonicToSeed(mnemonicCode);
        const root = HDKey.fromMasterSeed(seed);

        const pathBase = isBtc ? "m/84'/0'/0'/0" : "m/84'/2'/0'/0";
        const tx = new btc.Transaction(netParam);

        for (const utxo of selectedUtxos) {
          const child = root.derive(`${pathBase}/${utxo.path_index}`);

          tx.addInput({
            txid: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
              script: btc.p2wpkh(child.publicKey!, netParam).script,
              amount: BigInt(utxo.value),
            },
          });
        }

        const amountSats = BigInt(Math.floor(amt * 100_000_000));
        tx.addOutputAddress(addr, amountSats, netParam);

        const inputTotal = selectedUtxos.reduce((acc, u) => acc + BigInt(u.value), 0n);
        const feeSats = BigInt(Math.ceil(estimatedFee.fee * 100_000_000));
        const change = inputTotal - amountSats - feeSats;

        if (inputTotal < amountSats + feeSats) {
          return notify(`Insufficient selected funds. Need ${(Number(amountSats + feeSats) / 1e8).toFixed(6)}`, 'alert');
        }

        if (change > 546n) {
          const lastUsedIndex = Math.max(0, crypto.wallet[$currentCrypto as 'btc'].next_index - 1);
          const returnAddress = deriveXPub($currentCrypto, $identity.wallet_keys[$currentCrypto as 'btc'], lastUsedIndex);
          tx.addOutputAddress(returnAddress, change, netParam);
        }

        for (let i = 0; i < selectedUtxos.length; i++) {
          const utxo = selectedUtxos[i];
          const child = root.derive(`${pathBase}/${utxo.path_index}`);
          tx.signIdx(child.privateKey!, i);
        }

        tx.finalize();
        broadcastPayload.hex = tx.hex;
      }

      if (['eth', 'usdt'].includes($currentCrypto)) {
        if (!isAddress(addr)) return notify('Invalid Ethereum Address', 'alert');

        const wallet = crypto.wallet[$currentCrypto as 'eth'];

        const account = mnemonicToAccount(mnemonicCode);
        const client = createWalletClient({account, chain: mainnet, transport: http()});
        const gasPrice = parseUnits(crypto.fees[$currentCrypto][selectedPriority].toString(), 9);

        const ethBalanceWei = parseEther(String(crypto.wallet['eth'].balance));
        const feeWei = gasPrice * ($currentCrypto === 'usdt' ? BigInt(65000) : BigInt(21000));

        let serializedRequest;

        if ($currentCrypto === 'usdt') {
          const tokenBalance = parseUnits(String(crypto.wallet['usdt'].balance), 6);
          const amountToken = parseUnits(String(amt), 6);

          if (tokenBalance < amountToken) return notify('Insufficient USDT Balance', 'alert');
          if (ethBalanceWei < feeWei) return notify('Insufficient ETH for Gas', 'alert');

          const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
          const ERC20_ABI = [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                {name: 'recipient', type: 'address'},
                {name: 'amount', type: 'uint256'},
              ],
              outputs: [{type: 'bool'}],
            },
          ];

          const data = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [addr, parseUnits(String(amt), 6)],
          });

          serializedRequest = await client.signTransaction({
            to: USDT_CONTRACT,
            data,
            value: 0n,
            nonce: wallet.nonce,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
            gas: 65000n,
          });
        } else {
          const amountWei = parseEther(String(amt));
          if (ethBalanceWei < amountWei + feeWei) return notify('Insufficient ETH Balance', 'alert');

          serializedRequest = await client.signTransaction({
            to: addr,
            value: parseEther(String(amt)),
            nonce: wallet.nonce,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
            gas: 21000n,
          });
        }

        broadcastPayload.hex = serializedRequest;
      }
    } catch (error) {
      if (error instanceof Error) return notify(error.message, 'alert');
      else return notify(error as unknown as string, 'alert');
    }

    const response = await fetchAPI('crypto/broadcast', 'POST', broadcastPayload);
    const announceMessage = response.err ? response.err : successMessage;
    notify(announceMessage, response.type);
  }

  onMount(() => automaticUtxoSelection());
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
      <h3>Send {cryptoTitles[$currentCrypto]}</h3>
      <div class="flex flex-col gap-1">
        <label for="amount">
          Amount in {$currentCrypto.toUpperCase()}
          <span class="text-neutral-500">(1 {$currentCrypto.toUpperCase()} = {formatUSD(crypto.prices[$currentCrypto].to_usd)})</span>
        </label>
        <input bind:value={amount} onchange={() => automaticUtxoSelection()} type="number" name="amount" placeholder="0.00" />
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
          <span>(~{formatUSD(Number(estimatedFee.fee) * crypto.prices[$currentCrypto].to_usd)})</span>
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
