<script lang="ts">
  import {request} from '$utils/webfetch';
  import {deriveXPub, decrypt} from '$utils/cryptography';
  import {
    selectBestUtxos,
    estimateTransactionFee,
    signTransaction,
    acquireEvmSend,
    checkPendingEvmSend,
    recordPendingEvmSend,
    pendingEvmSend,
    clearPendingEvmSend,
  } from '$utils/wallet';
  import type {prepareMoneroTransaction} from '$utils/monero';
  import {vaultKey} from '$store';
  import {get} from 'svelte/store';
  import {onDestroy} from 'svelte';
  import type {
    FullIdentity,
    Coins,
    WalletState,
    UTXOData,
    Priority,
    transactionData,
    EvmPreparation,
    PendingEvmSend,
  } from '$type';
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
  }: {
    account: FullIdentity;
    coin: Coins;
    crypto: WalletState;
    sweep?: boolean;
    oncomplete: () => Promise<void>;
  } = $props();
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
  let releaseSend: (() => void) | undefined;
  let sendingAddress = '';
  let preparedNonce: number | undefined;
  let unresolved = $state<PendingEvmSend | null>(null);

  function discardPreparation() {
    payload = undefined;
    monero = undefined;
    releaseSend?.();
    releaseSend = undefined;
  }

  $effect(() => {
    if (!review && !pending) {
      discardPreparation();
    }
  });

  onDestroy(() => {
    active = false;
    privateKey = '';
    discardPreparation();
  });

  let selected = $state<UTXOData>([]);
  const utxos = $derived(
    (coin === 'btc' || coin === 'ltc') && crypto.wallet[coin].status !== 'Unavailable' ? crypto.wallet[coin].utxos : [],
  );
  const fee = $derived.by(() => {
    try {
      return estimateTransactionFee(coin, selected, crypto.fees[coin]?.[priority] ?? 0, amount);
    } catch {
      return {fee: 0, unit: coin === 'usdt' ? 'ETH' : coin.toUpperCase()};
    }
  });

  function selectCoins() {
    if (coin !== 'btc' && coin !== 'ltc') {
      return;
    }

    try {
      selected = selectBestUtxos(utxos, amount, crypto.fees[coin]?.[priority] ?? 0);
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
    discardPreparation();

    const key = get(vaultKey);
    const requestedAmount = amount;
    const recipient = destination;

    try {
      if (sweep) {
        await prepareSweep();

        return;
      }

      if (coin === 'xmr') {
        const {prepareMoneroTransaction} = await import('$utils/monero');
        const prepared = await prepareMoneroTransaction(
          crypto.wallet.xmr.nodeUrl,
          recipient,
          requestedAmount,
          {low: 1, medium: 2, high: 3}[priority],
        );

        if (!active || get(vaultKey) !== key) {
          return;
        }

        monero = prepared;
        reviewed = {amount: requestedAmount, recipient, fee: prepared.fee, unit: 'XMR'};
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

      let prepared: EvmPreparation | undefined;

      if (coin === 'eth' || coin === 'usdt') {
        sendingAddress = account.walletKeys.evm;
        releaseSend = await acquireEvmSend(sendingAddress);
        unresolved = pendingEvmSend(sendingAddress);

        if (!active || get(vaultKey) !== key) {
          return;
        }

        const response = await request<EvmPreparation>(`/identities/${account.id}/wallet/prepare`, 'POST', {
          coin,
          recipient,
          amount: requestedAmount,
          priority,
        });

        if (!response.ok) {
          throw new Error(response.error);
        }

        prepared = response.data;
        unresolved = pendingEvmSend(sendingAddress);
        checkPendingEvmSend(sendingAddress, prepared.nonce);
        unresolved = null;
        preparedNonce = prepared.nonce;
      }

      const wallet = coin === 'btc' || coin === 'ltc' ? crypto.wallet[coin] : undefined;
      const signed = await signTransaction(coin, recipient, requestedAmount, {
        senderAddress: prepared ? sendingAddress : undefined,
        gasLimit: prepared?.gasLimit,
        maxFeePerGas: prepared?.maxFeePerGas,
        maxPriorityFeePerGas: prepared?.maxPriorityFeePerGas,
        feeAtoms: estimateTransactionFee(coin, selected, crypto.fees[coin]?.[priority] ?? 0, requestedAmount).feeAtoms,
        privKeyType: 'mnemonic',
        wifKey: mnemonic,
        index: wallet && wallet.status !== 'Unavailable' ? (wallet.nextIndex ?? undefined) : undefined,
        xpubKey: coin === 'btc' || coin === 'ltc' ? account.walletKeys[coin] : undefined,
        utxos: selected,
        nonce: prepared?.nonce,
        balanceAtoms: coin === 'usdt' ? prepared?.usdtBalanceAtoms : prepared?.ethBalanceAtoms,
        gasBalanceAtoms: prepared?.ethBalanceAtoms,
      });

      if (!active || get(vaultKey) !== key) {
        return;
      }

      payload = signed;
      reviewed = {amount: requestedAmount, recipient, fee: signed.fee, unit: signed.feeUnit};
      review = true;
    } catch (cause) {
      discardPreparation();
      error = cause instanceof Error ? cause.message : 'Could not prepare this transaction.';
    } finally {
      if (!active || get(vaultKey) !== key) {
        discardPreparation();
      }

      pending = false;
    }
  }

  async function prepareSweep() {
    const [{formatUnits}, {privateKeyToAccount}, bitcoin, {HDKey}] = await Promise.all([
      import('viem'),
      import('viem/accounts'),
      import('@scure/btc-signer'),
      import('@scure/bip32'),
    ]);
    const key = get(vaultKey);
    const importedKey = privateKey;
    let transfer: transactionData;

    if (coin === 'btc' || coin === 'ltc') {
      const network = coin === 'btc' ? undefined : {bech32: 'ltc', pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0};
      const decoded = bitcoin.WIF(network).decode(importedKey);
      const publicKey = new HDKey({privateKey: decoded, chainCode: new Uint8Array(32)}).publicKey!;
      const witness = bitcoin.p2wpkh(publicKey, network);
      const addresses = [
        witness.address!,
        bitcoin.p2sh(witness, network).address!,
        bitcoin.p2pkh(publicKey, network).address!,
      ];
      const rate = crypto.fees[coin]?.[priority];

      if (!rate || rate <= 0) {
        throw new Error('Current transaction fees are unavailable.');
      }

      const result = await request<{balance: number; utxos: UTXOData}>(
        `/identities/${account.id}/wallet/sweep`,
        'POST',
        {coin, addresses},
      );

      if (!result.ok) {
        throw new Error(result.error);
      }

      const minerFee = Math.ceil((result.data.utxos.length * 148 + 44) * rate);
      const satoshis = BigInt(result.data.balance) - BigInt(minerFee);
      const wallet = crypto.wallet[coin];

      if (satoshis <= 0n) {
        throw new Error('The balance does not cover the network fee.');
      }

      if (wallet.status !== 'Synced' || wallet.nextIndex === null) {
        throw new Error('A complete discovery scan is required before sweeping to this wallet.');
      }

      amount = formatUnits(satoshis, 8);
      destination = deriveXPub(coin, account.walletKeys[coin], wallet.nextIndex);
      transfer = {
        feeAtoms: String(minerFee),
        privKeyType: 'wif',
        wifKey: importedKey,
        utxos: result.data.utxos.map((item) => ({...item, pathIndex: 0})),
      };
    } else {
      sendingAddress = privateKeyToAccount(
        (importedKey.startsWith('0x') ? importedKey : `0x${importedKey}`) as `0x${string}`,
      ).address;
      releaseSend = await acquireEvmSend(sendingAddress);
      unresolved = pendingEvmSend(sendingAddress);

      if (!active || get(vaultKey) !== key) {
        return;
      }

      destination = account.walletKeys.evm;
      const result = await request<EvmPreparation>(`/identities/${account.id}/wallet/prepare`, 'POST', {
        coin,
        address: sendingAddress,
        recipient: destination,
        amount: '0',
        priority,
        sweep: true,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      const prepared = result.data;
      checkPendingEvmSend(sendingAddress, prepared.nonce);
      unresolved = null;
      preparedNonce = prepared.nonce;
      amount = formatUnits(BigInt(prepared.amountAtoms), coin === 'eth' ? 18 : 6);
      transfer = {
        senderAddress: sendingAddress,
        nonce: prepared.nonce,
        balanceAtoms: coin === 'usdt' ? prepared.usdtBalanceAtoms : prepared.ethBalanceAtoms,
        gasBalanceAtoms: prepared.ethBalanceAtoms,
        gasLimit: prepared.gasLimit,
        maxFeePerGas: prepared.maxFeePerGas,
        maxPriorityFeePerGas: prepared.maxPriorityFeePerGas,
        privKeyType: 'hex',
        wifKey: importedKey,
      };
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
    const key = get(vaultKey);

    if (!key || !active) {
      discardPreparation();
      return;
    }

    pending = true;
    error = '';

    try {
      if (coin === 'xmr') {
        if (!monero) {
          throw new Error('Prepare the transaction again.');
        }

        const {broadcastMoneroTransaction} = await import('$utils/monero');
        const warning = await broadcastMoneroTransaction(crypto.wallet.xmr.nodeUrl, monero);
        txid = monero.txid;
        success = warning || 'Monero transaction relayed. Sync the wallet to verify its status.';
      } else {
        if (!payload) {
          throw new Error('Prepare the transaction again.');
        }

        if (coin === 'eth' || coin === 'usdt') {
          const fresh = await request<EvmPreparation>(`/identities/${account.id}/wallet/prepare`, 'POST', {
            coin,
            address: sendingAddress,
            recipient: reviewed.recipient,
            amount: reviewed.amount,
            priority,
          });

          if (!active || get(vaultKey) !== key) {
            discardPreparation();
            return;
          }

          if (!fresh.ok) {
            throw new Error(fresh.error);
          }

          if (fresh.data.nonce !== preparedNonce) {
            discardPreparation();
            review = false;
            throw new Error('The pending nonce changed after review. Prepare the transaction again.');
          }

          const {keccak256} = await import('viem');
          const saved = {nonce: preparedNonce!, hex: payload.hex, txid: keccak256(payload.hex as `0x${string}`), coin};
          recordPendingEvmSend(sendingAddress, saved);
          unresolved = saved;
        }

        const result = await request<{txid: string}>(`/identities/${account.id}/wallet/transactions`, 'POST', {
          coin: payload.coin,
          hex: payload.hex,
        });

        if (!result.ok) {
          if (result.code === 'broadcast_rejected' && unresolved) {
            clearPendingEvmSend(sendingAddress, unresolved.txid);
            unresolved = null;
            review = false;
            discardPreparation();
          }

          throw new Error(`${result.error} If broadcast was interrupted, check transaction history before retrying.`);
        }

        txid = result.data.txid;
        success = 'Transaction submitted to the network. Confirmation may take time.';
        unresolved = null;
      }

      discardPreparation();
      review = false;
      amount = '';
      await oncomplete();
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'Broadcast could not be confirmed. Check history before sending again.';
    } finally {
      pending = false;
    }
  }
  async function recoverBroadcast(retry: boolean) {
    const key = get(vaultKey);

    if (!unresolved || !sendingAddress || !key || !active) {
      return;
    }

    pending = true;
    error = '';
    let release: (() => void) | undefined;

    try {
      releaseSend?.();
      releaseSend = undefined;
      release = await acquireEvmSend(sendingAddress);
      if (!active || get(vaultKey) !== key) {
        return;
      }

      const saved = pendingEvmSend(sendingAddress);

      if (!saved) {
        unresolved = null;
        return;
      }

      const {keccak256, parseTransaction, recoverTransactionAddress} = await import('viem');
      const serialized = saved.hex as import('viem').TransactionSerialized;
      const parsed = parseTransaction(serialized);
      const sender = await recoverTransactionAddress({serializedTransaction: serialized});

      if (
        parsed.chainId !== 1 ||
        parsed.nonce !== saved.nonce ||
        sender.toLowerCase() !== sendingAddress.toLowerCase() ||
        keccak256(saved.hex as `0x${string}`) !== saved.txid
      ) {
        throw new Error(
          'The saved transaction does not match its broadcast reference. Check history before continuing.',
        );
      }

      const lookup = await request<{status: string}>(
        `/identities/${account.id}/wallet/transactions/reconcile`,
        'POST',
        {
          address: sendingAddress,
          txid: saved.txid,
          nonce: saved.nonce,
        },
      );

      if (!active || get(vaultKey) !== key) {
        return;
      }

      if (!lookup.ok) {
        throw new Error(lookup.error);
      }

      if (lookup.data.status === 'unknown' && !retry) {
        throw new Error(
          'The provider has not seen this transaction. Retry the same signed transaction to recover an interrupted or dropped broadcast.',
        );
      }

      if (lookup.data.status === 'unknown') {
        const result = await request<{txid: string}>(`/identities/${account.id}/wallet/transactions`, 'POST', {
          coin: saved.coin,
          hex: saved.hex,
        });

        if (!result.ok) {
          if (result.code === 'broadcast_rejected') {
            clearPendingEvmSend(sendingAddress, saved.txid);
            unresolved = null;
          }

          throw new Error(result.error);
        }
      }

      if (lookup.data.status === 'consumed') {
        clearPendingEvmSend(sendingAddress, saved.txid);
      }

      unresolved = null;
      review = false;
      discardPreparation();
      txid = saved.txid;
      success =
        lookup.data.status === 'consumed'
          ? 'The sender nonce has advanced. Check history before preparing another transfer.'
          : 'The provider has this transaction. Check history for confirmation.';
      await oncomplete();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Broadcast status is unavailable.';
    } finally {
      release?.();
      pending = false;
    }
  }
</script>

<section class="panel">
  <h3>{sweep ? 'Sweep a private key' : `Send ${coin.toUpperCase()}`}</h3>
  {#if sweep}<p>Transfers the source balance minus the network fee. The private key stays in your browser.</p>{/if}
  {#if (coin === 'btc' || coin === 'ltc') && crypto.wallet[coin].status === 'Incomplete'}<Status
      message="Discovery is incomplete. This send uses only verified outputs and returns change to an existing address. Reusing an address links payments publicly." />{/if}
  <Status message={error} kind="error" /><Status message={success} kind="success" />{#if txid}<Copy
      value={txid}
      label="Copy transaction ID" />{/if}
  {#if unresolved}
    <p>
      A previous ETH or USDT broadcast needs a status check. Retrying submits the same signed bytes and cannot create a
      second transfer.
    </p>
    <div class="button-row">
      <Button loading={pending} onclick={() => recoverBroadcast(false)}>Look up previous broadcast</Button>
      <Button loading={pending} variant="quiet" onclick={() => recoverBroadcast(true)}>Retry previous broadcast</Button>
    </div>
  {/if}
  <form onsubmit={prepare} class="transfer-form">
    {#if sweep}<div class="field">
        <label for="sweep-key">{coin === 'btc' || coin === 'ltc' ? 'WIF private key' : 'Hex private key'}</label><input
          id="sweep-key"
          type="password"
          bind:value={privateKey}
          disabled={pending}
          autocomplete="off"
          required />
      </div>{:else}<div class="form-grid">
        <div class="field">
          <label for="send-amount">Amount in {coin.toUpperCase()}</label><input
            id="send-amount"
            inputmode="decimal"
            bind:value={amount}
            disabled={pending}
            onchange={selectCoins}
            pattern="[0-9]+(\.[0-9]+)?"
            required />
        </div>
        <div class="field">
          <label for="send-priority">Network priority</label><select
            id="send-priority"
            bind:value={priority}
            disabled={pending}
            onchange={selectCoins}
            ><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option
            ></select>
        </div>
        <div class="field wide">
          <label for="send-destination">Recipient address</label><input
            id="send-destination"
            bind:value={destination}
            disabled={pending}
            autocomplete="off"
            required />
        </div>
      </div>
      {#if coin === 'btc' || coin === 'ltc'}<p>
          Estimated network fee · {fee.fee}
          {fee.unit}
        </p>{:else if coin !== 'xmr'}<p>
          The exact transfer and selected priority are used to estimate gas during preparation.
        </p>{/if}{#if utxos.length}<details class="coin-control">
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
      <Button type="submit" loading={pending}>Prepare transaction</Button><Button
        type="button"
        variant="quiet"
        onclick={() => (scanning = true)}>Scan QR code</Button>
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
  <Status message="Crypto transactions cannot be reversed. Verify this address before sending." /><Status
    message={error}
    kind="error" /><Button loading={pending} icon="send" onclick={broadcast}>Broadcast transaction</Button></Dialog>

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
