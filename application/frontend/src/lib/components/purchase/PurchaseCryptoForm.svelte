<script lang="ts">
  import type {Coins} from '$type';
  import {PAYMENT_ASSET_OPTIONS} from '$constant';
  import Select from '$component/ui/Select.svelte';
  import Button from '$component/ui/Button.svelte';

  let {
    ticker = $bindable('xmr'),
    refund = $bindable(''),
    pending = false,
    onsubmit,
  }: {
    ticker: Coins;
    refund: string;
    pending?: boolean;
    onsubmit: (event: SubmitEvent) => void;
  } = $props();
</script>

<form {onsubmit}>
  <div class="field">
    <label for="billing-coin">Payment asset and network</label>
    <Select
      id="billing-coin"
      label="Payment asset and network"
      options={PAYMENT_ASSET_OPTIONS}
      bind:value={ticker}
      disabled={pending}
      required />
  </div>
  <p class="network-note">
    {ticker === 'xmr'
      ? 'Direct Monero payment.'
      : 'Converted to XMR through an external swap provider. Network fees may apply.'}
  </p>
  <div class="field refund-field">
    <label for="billing-refund">Refund address <span>Optional</span></label>
    <input
      id="billing-refund"
      bind:value={refund}
      disabled={pending}
      placeholder="Address for {ticker.toUpperCase()}" />
  </div>
  <Button type="submit" icon="wallet" loading={pending}>Review crypto payment</Button>
</form>

<style>
  .network-note {
    color: var(--muted);
    font-size: 10px;
    line-height: 1.6;
    margin: 5px 0 12px;
  }
  .refund-field label {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .refund-field label span {
    font-size: 10px;
    color: var(--muted);
    font-weight: 400;
  }
  form :global(svg) {
    color: currentColor;
  }
</style>
