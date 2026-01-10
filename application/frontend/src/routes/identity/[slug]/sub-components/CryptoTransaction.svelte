<script lang="ts">
  import type {Writable} from 'svelte/store';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'gift' | 'swap'>;
  }

  let {mode}: Props = $props();
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
