<script lang="ts">
  import {untrack} from 'svelte';
  import {request} from '$utils/webfetch';
  import type {FullIdentity, Coins, CryptoAPI, Provider} from '$type';
  import Button from '$component/ui/Button.svelte';
  import Status from '$component/ui/Status.svelte';
  import Copy from '$component/ui/Copy.svelte';

  let {account, coin}: {account: FullIdentity; coin: Coins} = $props();
  let amount = $state('');
  let destinationCoin = $state<Coins>(untrack(() => (coin === 'xmr' ? 'btc' : 'xmr')));
  let destination = $state('');
  let refund = $state('');
  let providers = $state<Provider[]>([]);
  let pending = $state(false);
  let error = $state('');
  let trade = $state<CryptoAPI | null>(null);
  let requestID = crypto.randomUUID();
  let tradeID = '';
  let quoteInput: {coinFrom: Coins; coinTo: Coins; amount: number};

  function clearQuotes() {
    providers = [];
    tradeID = '';
  }

  async function quotes(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    error = '';
    providers = [];
    quoteInput = {coinFrom: coin, coinTo: destinationCoin, amount: Number(amount)};

    const result = await request<CryptoAPI>(`/identities/${account.id}/wallet/swap-quotes`, 'GET', quoteInput);
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    providers = result.data.providers || [];
    tradeID = result.data.tradeID || '';
    requestID = crypto.randomUUID();
  }

  async function create(provider: string) {
    pending = true;
    error = '';

    const result = await request<CryptoAPI>(`/identities/${account.id}/wallet/swaps`, 'POST', {
      ...quoteInput,
      destinationAddress: destination,
      refundAddress: refund,
      provider,
      tradeID,
      isFixed: providers.find((item) => item.name === provider)?.isFixed || false,
      requestID,
    });
    pending = false;

    if (!result.ok) {
      error = result.error;

      return;
    }

    trade = result.data;
  }
</script>

<section class="panel">
  <h3>Swap {coin.toUpperCase()}</h3>
  <p>External swap providers quote and process the exchange. Review their requirements before depositing.</p>
  <Status message={error} kind="error" />{#if trade}<Status
      message="Swap created. Deposit only the specified amount. Keep the trade reference until completion." />
    <dl class="data-list">
      <div>
        <dt>Trade reference</dt>
        <dd>{trade.tradeID || trade.providerTradeID}</dd>
      </div>
      <div>
        <dt>Deposit amount</dt>
        <dd><Copy value={String(trade.depositAmount)} label="Copy amount" /></dd>
      </div>
      <div>
        <dt>Deposit address</dt>
        <dd><Copy value={trade.depositAddress || ''} label="Copy address" /></dd>
      </div>
      {#if trade.depositMemo}<div>
          <dt>Memo</dt>
          <dd><Copy value={trade.depositMemo} /></dd>
        </div>{/if}
    </dl>
    {#if trade.externalLink}<a class="control-button secondary swap-link" href={trade.externalLink} target="_blank" rel="noopener noreferrer"
        >Track provider trade</a
      >{/if}{:else}<form onsubmit={quotes} class="swap-form">
      <div class="form-grid">
        <div class="field">
          <label for="swap-amount">Amount in {coin.toUpperCase()}</label><input
            id="swap-amount"
            bind:value={amount}
            disabled={pending}
            oninput={clearQuotes}
            inputmode="decimal"
            pattern="[0-9]+(\.[0-9]+)?"
            required />
        </div>
        <div class="field">
          <label for="swap-coin">Receive coin</label><select id="swap-coin" bind:value={destinationCoin} disabled={pending} onchange={clearQuotes}
            >{#each ['btc', 'ltc', 'eth', 'usdt', 'xmr'] as ticker (ticker)}{#if ticker !== coin}<option value={ticker}>{ticker.toUpperCase()}</option
                >{/if}{/each}</select>
        </div>
        <div class="field wide">
          <label for="swap-destination">Receive address</label><input
            id="swap-destination"
            bind:value={destination}
            disabled={pending}
            oninput={clearQuotes}
            required />
        </div>
        <div class="field wide">
          <label for="swap-refund">Refund address in {coin.toUpperCase()}</label><input
            id="swap-refund"
            bind:value={refund}
            disabled={pending}
            oninput={clearQuotes}
            required />
        </div>
      </div>
      <Button loading={pending} type="submit">Get provider quotes</Button>
    </form>
    {#if providers.length}<div class="quote-list">
        {#each providers as provider (provider.name)}<article>
            <div>
              <h3>{provider.name}</h3>
              <p>{provider.returnCoin} {destinationCoin.toUpperCase()} · Approx. {provider.eta} minutes</p>
              <small>KYC rating {provider.kycRating} · Logs rating {provider.logPolicy} · Fee {provider.costPercentage}%</small>
            </div>
            <Button variant="secondary" loading={pending} onclick={() => create(provider.name)}>Create swap</Button>
          </article>{/each}
      </div>{/if}{/if}
</section>

<style>
  .swap-form {
    margin-top: 24px;
  }
  .quote-list {
    margin-top: 25px;
    display: grid;
    gap: 15px;
  }
  .quote-list article {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-top: 1px solid #a5b4fc20;
    padding-top: 17px;
  }
  .swap-link {
    margin-top: 20px;
  }
  @media (max-width: 600px) {
    .quote-list article {
      flex-wrap: wrap;
    }
  }
</style>
