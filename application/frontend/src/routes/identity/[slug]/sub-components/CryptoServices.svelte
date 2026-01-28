<script lang="ts">
  import type {Writable} from 'svelte/store';
  import type {APIResponse} from '$type';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'gift' | 'swap'>;
    crypto: APIResponse;
  }

  let {mode, crypto}: Props = $props();
</script>

{#if $mode === 'gift'}
  <h3>Buy Gift Cards</h3>
{:else if $mode === 'swap'}
  <h3>Swap Coins</h3>
{:else if $mode === 'invoice'}
  <h3>Generate PDF Invoice</h3>
{/if}
