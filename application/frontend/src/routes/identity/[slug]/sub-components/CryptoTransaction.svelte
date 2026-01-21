<script lang="ts">
  import type {Writable} from 'svelte/store';
  import type {APIResponse} from '$type';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'gift' | 'swap'>;
    crypto: APIResponse;
  }

  let {mode, crypto}: Props = $props();
</script>

{#if $mode === 'invoice'}
  <h3>Generate PDF Invoice</h3>
{:else if $mode === 'receive'}
  <h3>Receive Payments</h3>
{:else if $mode === 'sweep'}
  <h3>Sweep Wallet</h3>
{:else if $mode === 'send'}
  <h3>Send Payment</h3>
{/if}
