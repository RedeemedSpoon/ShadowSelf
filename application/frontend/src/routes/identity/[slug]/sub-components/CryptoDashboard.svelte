<script lang="ts">
  import type {APIResponse, Coins} from '$type';
  import type {Writable} from 'svelte/store';

  interface Props {
    currentCrypto: Writable<Coins>;
    crypto: APIResponse;
  }

  let {currentCrypto, crypto}: Props = $props();
  const balance: number = $derived(crypto.wallet[$currentCrypto as 'btc'].balance);
</script>

<h3>Balance : {balance}</h3>
