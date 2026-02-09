<script lang="ts">
  import type {Writable} from 'svelte/store';
  import type {APIResponse} from '$type';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'market' | 'swap'>;
    cryptoTitles: {[key: string]: string};
    crypto: APIResponse;
  }

  let {mode, cryptoTitles, crypto}: Props = $props();
</script>

{#if $mode === 'market'}
  <h3>Spend & Discover</h3>
{:else if $mode === 'swap'}
  <h3>Swap Coins</h3>
{:else if $mode === 'invoice'}
  <h3>Generate PDF Invoice</h3>
{/if}
