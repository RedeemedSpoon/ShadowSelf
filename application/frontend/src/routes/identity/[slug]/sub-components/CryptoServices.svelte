<script lang="ts">
  import type {Writable} from 'svelte/store';

  interface Props {
    mode: Writable<'view' | 'send' | 'sweep' | 'receive' | 'invoice' | 'gift' | 'swap'>;
  }

  let {mode}: Props = $props();
</script>

{#if $mode === 'gift'}
  <h3>Buy Gift Cards</h3>
{:else if $mode === 'swap'}
  <h3>Swap Coins</h3>
{/if}
