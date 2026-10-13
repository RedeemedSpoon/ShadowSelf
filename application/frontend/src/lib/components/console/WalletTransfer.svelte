<script lang="ts">
  import {parseUnits, formatUnits} from 'viem';
  import {privateKeyToAccount} from 'viem/accounts';
  import * as bitcoin from '@scure/btc-signer';
  import {HDKey} from '@scure/bip32';
  import {request} from '$utils/webfetch';
  import {deriveXPub, decrypt} from '$utils/cryptography';
  import {selectBestUtxos, estimateTransactionFee, signTransaction} from '$utils/wallet';
  import {prepareMoneroTransaction, broadcastMoneroTransaction} from '$utils/monero';
  import {vaultKey} from '$store';
  import {get} from 'svelte/store';
  import {onDestroy} from 'svelte';
  import type {FullIdentity, Coins, CryptoAPI, UTXOData, Priority, transactionData} from '$type';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Dialog from '$component/ui/Dialog.svelte';
  import Copy from '$component/ui/Copy.svelte';
  import QrReader from './QrReader.svelte';

  let {
    account,
    coin,
    crypto,
    sweep = false,
    oncomplete,
  }: {account: FullIdentity; coin: Coins; crypto: CryptoAPI; sweep?: boolean; oncomplete: () => Promise<void>} = $props();
  let amount = $state('');
  let destination = $state('');
  let privateKey = $state('');
  let priority = $state<Priority>('medium');
  let pending = $state(false);
  let error = $state('');
  let success = $state('');
  let scanning = $state(false);
  let review = $state(false);
  let txid = $state('');
  let payload: Awaited<ReturnType<typeof signTransaction>> | undefined;
  let monero: Awaited<ReturnType<typeof prepareMoneroTransaction>> | undefined;
  let reviewed = $state({amount: '', recipient: '', fee: '', unit: ''});
  let active = true;

  onDestroy(() => {
    active = false;
    privateKey = '';
    payload = undefined;
    monero = undefined;
  });

  let selected = $state<UTXOData>([]);
  const utxos = $derived(coin === 'btc' || coin === 'ltc' ? crypto.wallet[coin].utxos : []);
  const fee = $derived.by(() => {
    try {
      return estimateTransactionFee(coin, selected, crypto.fees[coin][priority], amount);
    } catch {
      return {fee: 0, unit: coin === 'usdt' ? 'ETH' : coin.toUpperCase()};
    }
  });

  function selectCoins() {
    if (coin !== 'btc' && coin !== 'ltc') {
      return;
    }

    try {
      selected = selectBestUtxos(utxos, amount, crypto.fees[coin][priority]);
    } catch {
      selected = [];
    }
  }

  async function prepare(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    error = '';
    success = '';
    txid = '';
    payload = undefined;
    monero = undefined;

    const key = get(vaultKey);

    try {
      if (sweep) {
        await prepareSweep();

        return;
      }

      if (coin === 'xmr') {
        const prepared = await prepareMoneroTransaction(crypto.wallet.xmr.nodeUrl, destination, amount, {low: 1, medium: 2, high: 3}[priority]);

        if (!active || get(vaultKey) !== key) {
          return;
        }

        monero = prepared;
        reviewed = {amount, recipient: destination, fee: prepared.fee, unit: 'XMR'};
        review = true;

        return;
      }

      if (!selected.length && (coin === 'btc' || coin === 'ltc')) {
        selectCoins();
      }

      const mnemonic = await decrypt(account.walletBlob, key!);

      if (!mnemonic) {
        throw new Error('Could not decrypt the wallet recovery phrase.');
      }

      const wallet = crypto.wallet[coin as 'btc'];
      const signed = await signTransaction(coin, destination, amount, {
        estimatedFee:
          coin === 'btc' || coin === 'ltc' ? estimateTransactionFee(coin, selected, crypto.fees[coin][priority], amount) : crypto.fees[coin][priority],
        privKeyType: 'mnemonic',
        wifKey: mnemonic,
        index: wallet.nextIndex,
        xpubKey: account.walletKeys[coin as 'btc'],
        utxos: selected,
        nonce: crypto.wallet[coin as 'eth'].nonce,
        balance: crypto.wallet[coin].balance,
        gasBalance: crypto.wallet.eth.balance,
        balanceAtoms: crypto.wallet[coin as 'eth'].balanceAtoms,
        gasBalanceAtoms: crypto.wallet.eth.balanceAtoms,
      });

      if (!active || get(vaultKey) !== key) {
        return;
      }

      payload = signed;
      reviewed = {amount, recipient: destination, fee: signed.fee, unit: signed.feeUnit};
      review = true;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Could not prepare this transaction.';
    } finally {
      pending = false;
    }
  }

  async function prepareSweep() {
    const key = get(vaultKey);
    const importedKey = privateKey;
    let addresses: string[];

    if (coin === 'btc' || coin === 'ltc') {
      const network = coin === 'btc' ? undefined : {bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0};
      const key = bitcoin.WIF(network).decode(importedKey);
      const publicKey = new HDKey({privateKey: key, chainCode: new Uint8Array(32)}).publicKey!;
      const witness = bitcoin.p2wpkh(publicKey, network);
      addresses = [witness.address!, bitcoin.p2sh(witness, network).address!, bitcoin.p2pkh(publicKey, network).address!];
    } else {
      addresses = [privateKeyToAccount((importedKey.startsWith('0x') ? importedKey : `0x${importedKey}`) as `0x${string}`).address];
    }

    const result = await request<{balance: number | string; gasBalance?: string; utxos?: UTXOData; nonce?: number}>(
      `/identities/${account.id}/wallet/sweep`,
      'POST',
      {coin, addresses},
    );

    if (!result.ok) {
      throw new Error(result.error);
    }

    const data = result.data;
    const rate = crypto.fees[coin].medium;
    let transfer: transactionData = {
      estimatedFee: rate,
      privKeyType: 'hex',
      wifKey: importedKey,
      nonce: data.nonce,
      balanceAtoms: String(data.balance),
      gasBalanceAtoms: data.gasBalance,
    };

    if (coin === 'btc' || coin === 'ltc') {
      const minerFee = Math.ceil(((data.utxos?.length || 0) * 148 + 44) * rate);
      const satoshis = BigInt(data.balance) - BigInt(minerFee);

      if (satoshis <= 0n) {
        throw new Error('The balance does not cover the network fee.');
      }

      amount = formatUnits(satoshis, 8);
      destination = deriveXPub(coin, account.walletKeys[coin], crypto.wallet[coin].nextIndex);
      transfer = {estimatedFee: {fee: minerFee / 1e8}, privKeyType: 'wif', wifKey: importedKey, utxos: data.utxos?.map((item) => ({...item, pathIndex: 0}))};
    } else {
      const gas = 21000n * parseUnits(String(rate), 9);
      const units = coin === 'eth' ? BigInt(data.balance) - gas : BigInt(data.balance);

      if (units <= 0n) {
        throw new Error('The source wallet has no spendable funds.');
      }

      amount = formatUnits(units, coin === 'eth' ? 18 : 6);
      destination = account.walletKeys.evm;
    }

    if (!active || get(vaultKey) !== key) {
      return;
    }

    const signed = await signTransaction(coin, destination, amount, transfer);
    privateKey = '';

    if (!active || get(vaultKey) !== key) {
      return;
    }

    payload = signed;
    reviewed = {amount, recipient: destination, fee: signed.fee, unit: signed.feeUnit};
    review = true;
  }

  async function broadcast() {
    pending = true;
    error = '';

    try {
      if (coin === 'xmr') {
        if (!monero) {
          throw new Error('Prepare the transaction again.');
        }

        const warning = await broadcastMoneroTransaction(crypto.wallet.xmr.nodeUrl, monero);
        txid = monero.txid;
        success = warning || 'Monero transaction relayed. Sync the wallet to verify its status.';
      } else {
        if (!payload) {
          throw new Error('Prepare the transaction again.');
        }

        const result = await request<{txid: string}>(`/identities/${account.id}/wallet/transactions`, 'POST', {coin: payload.coin, hex: payload.hex});

        if (!result.ok) {
          throw new Error(`${result.error} If broadcast was interrupted, check transaction history before retrying.`);
        }

        txid = result.data.txid;
        success = 'Transaction submitted to the network. Confirmation may take time.';
      }

      payload = undefined;
      monero = undefined;
      review = false;
      amount = '';
      await oncomplete();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Broadcast could not be confirmed. Check history before sending again.';
    } finally {
      pending = false;
    }
  }
</script>

<section class="panel">
  <h3>{sweep ? 'Sweep a private key' : `Send ${coin.toUpperCase()}`}</h3>
  {#if sweep}<p>Transfers the source balance minus the network fee. The private key stays in your browser.</p>{/if}
  <Status message={error} kind="error" /><Status message={success} kind="success" />{#if txid}<Copy value={txid} label="Copy transaction ID" />{/if}
  <form onsubmit={prepare} class="transfer-form">
    {#if sweep}<div class="field">
        <label for="sweep-key">{coin === 'btc' || coin === 'ltc' ? 'WIF private key' : 'Hex private key'}</label><input
          id="sweep-key"
          type="password"
          bind:value={privateKey}
          autocomplete="off"
          required />
      </div>{:else}<div class="form-grid">
        <div class="field">
          <label for="send-amount">Amount in {coin.toUpperCase()}</label><input
            id="send-amount"
            inputmode="decimal"
            bind:value={amount}
            onchange={selectCoins}
            pattern="[0-9]+(\.[0-9]+)?"
            required />
        </div>
        <div class="field">
          <label for="send-priority">Network priority</label><select id="send-priority" bind:value={priority} onchange={selectCoins}
            ><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
        </div>
        <div class="field wide">
          <label for="send-destination">Recipient address</label><input id="send-destination" bind:value={destination} autocomplete="off" required />
        </div>
      </div>
      {#if coin !== 'xmr'}<p>Estimated network fee · {fee.fee} {fee.unit}</p>{/if}{#if utxos.length}<details class="coin-control">
          <summary>Coin control · {selected.length} selected inputs</summary>
          <p>Spending inputs together links them publicly on the blockchain.</p>
          {#each utxos as input (`${input.txid}:${input.vout}`)}<label
              ><input
                type="checkbox"
                checked={selected.some((item) => item.txid === input.txid && item.vout === input.vout)}
                onchange={(event) =>
                  (selected = event.currentTarget.checked
                    ? [...selected, input]
                    : selected.filter((item) => item.txid !== input.txid || item.vout !== input.vout))} /><span
                >{input.value / 1e8} {coin.toUpperCase()} · {input.txid.slice(0, 10)}…</span
              ></label
            >{/each}
        </details>{/if}{/if}
    <div class="button-row">
      <Button type="submit" loading={pending}>Prepare transaction</Button><Button type="button" variant="quiet" onclick={() => (scanning = true)}
        >Scan QR code</Button>
    </div>
  </form>
</section>
<Dialog bind:open={scanning} title={sweep ? 'Scan private key' : 'Scan receive address'}
  ><QrReader
    onread={(value) => {
      if (sweep) {
        privateKey = value;
      } else {
        destination = value.replace(/^(bitcoin|litecoin|ethereum|monero):/, '').split('?')[0];
      }

      scanning = false;
    }} /></Dialog>
<Dialog bind:open={review} title="Review transaction"
  ><dl class="data-list">
    <div>
      <dt>Amount</dt>
      <dd>{reviewed.amount} {coin.toUpperCase()}</dd>
    </div>
    <div>
      <dt>Recipient</dt>
      <dd>{reviewed.recipient}</dd>
    </div>
    <div>
      <dt>Maximum network fee</dt>
      <dd>{reviewed.fee} {reviewed.unit}</dd>
    </div>
    <div>
      <dt>Network</dt>
      <dd>{coin === 'usdt' ? 'Ethereum ERC-20' : coin.toUpperCase()}</dd>
    </div>
  </dl>
  <Status message="Crypto transactions cannot be reversed. Verify this address before sending." /><Status message={error} kind="error" /><Button
    loading={pending}
    icon="send"
    onclick={broadcast}>Broadcast transaction</Button
  ></Dialog>

<style>
  .transfer-form {
    margin-top: 24px;
  }
  .transfer-form > .button-row {
    margin-top: 20px;
  }
  .coin-control {
    padding: 17px 0;
    color: #a8b6cf;
    font-size: 12px;
  }
  .coin-control summary {
    cursor: pointer;
    margin-bottom: 10px;
  }
  .coin-control label {
    display: flex;
    gap: 10px;
    margin-top: 12px;
  }
  .coin-control p {
    font-size: 11px;
  }
</style>
