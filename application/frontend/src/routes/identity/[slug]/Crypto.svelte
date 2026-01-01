<script lang="ts">
  import {fetchAPI} from '$fetch';
  import {onMount} from 'svelte';
  import {cart, lock} from '$image';
  import {masterPassword, modalIndex} from '$store';

  onMount(async () => console.log(await fetchAPI('crypto', 'GET')));
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-2xl font-bold text-neutral-300 sm:text-4xl md:text-5xl">Crypto Wallet</h1>
  <div class="grid gap-1 max-md:grid-cols-3 md:grid-flow-col"></div>
</section>

{#if $masterPassword}
  <section id="no-purchases" style="background-image: url({cart});">
    <h2 class="mt-12 text-5xl text-neutral-300">No Purchases</h2>
    <p class="text-center md:w-1/2">
      No money has been transferred to this wallet and no spending has been made yet. Send some funds over and start using it right
      away!
    </p>
    <button>Add Funds</button>
  </section>
{:else}
  <section id="no-purchases" style="background-image: url({lock});">
    <h2 class="mt-12 text-center text-5xl text-neutral-300">Encryption Key Missing</h2>
    <p class="text-center md:w-1/2">
      Your local session is missing the decryption key. Re-enter your Master Password to restore access to this identity crypto wallet.
    </p>
    <button onclick={() => ($modalIndex = 1)}>Enter Master Password</button>
  </section>
{/if}

<style lang="postcss">
  @reference "$style";

  #no-purchases {
    @apply mt-12 mb-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
