<script lang="ts">
  import {TransferIcon, AddFundsIcon, RetrieveFundsIcon} from '$icon';
  import {ActionIcon} from '$component';
  import {fetchAPI} from '$fetch';
  import {onMount} from 'svelte';
  import {cart} from '$image';

  onMount(async () => console.log(await fetchAPI('card', 'GET')));
</script>

<section class="mb-4 flex w-full items-center justify-between">
  <h1 class="text-2xl font-bold text-neutral-300 sm:text-4xl md:text-5xl">Virtual Card</h1>
  <div class="grid gap-1 max-md:grid-cols-3 md:grid-flow-col">
    <ActionIcon icon={TransferIcon} action={() => {}} title="Transfer Funds" />
    <ActionIcon icon={RetrieveFundsIcon} action={() => {}} title="Retrieve Funds" />
    <ActionIcon icon={AddFundsIcon} action={() => {}} title="Add Funds" />
  </div>
</section>
<section id="no-purchases" style="background-image: url({cart});">
  <h2 class="mt-12 text-5xl text-neutral-300">No Purchases</h2>
  <p class="text-center md:w-1/2">
    No money has been transferred to this card and no spending has been made yet. Send some funds over and start using it right away!
  </p>
  <button>Add Funds</button>
</section>

<style lang="postcss">
  #no-purchases {
    @apply mb-12 mt-12 flex flex-col items-center gap-8 bg-center bg-no-repeat;
  }
</style>
