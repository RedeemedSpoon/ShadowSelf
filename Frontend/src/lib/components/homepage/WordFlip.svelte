<script lang="ts">
  import {blur, fly} from 'svelte/transition';

  const words = ['Simple', 'Affordable', 'Secure', 'Reliable', 'Trusted', 'Private'];
  let index = 0;

  setInterval(() => (index = (index + 1) % words.length), 3500);
</script>

<div>
  <h4 class="text-lg text-neutral-500">Powered by You, and The Community.</h4>
  <div class="flex">
    <h2 class="from-primary-700 to-primary-700/90 text-8xl">The</h2>
    {#key index}
      <h1 in:fly={{y: 30, duration: 1000, delay: 300}} out:blur={{duration: 500, amount: 10}}>
        {words[index]}
      </h1>
    {/key}
  </div>
  <h2 class="bg-none text-neutral-300">Way to Do it All.</h2>
</div>

<style lang="postcss">
  h1 {
    @apply from-primary-700/90 to-primary-800 absolute ml-[195px] text-8xl font-bold;
  }
</style>
