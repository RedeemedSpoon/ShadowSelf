<script lang="ts">
  import {blur, fly} from 'svelte/transition';

  const words = ['Effective', 'Simple', 'Affordable', 'Secure', 'Superior', 'Reliable', 'Trusted', 'Private', 'Fast'];
  let index = $state(0);

  setInterval(() => (index = (index + 1) % words.length), 3000);
</script>

<div>
  <h6 class="text-lg text-neutral-500 max-sm:text-sm">Powered by You, and the Community.</h6>
  <div class="relative flex">
    <h2 class="text-6xl! max-sm:text-4xl! md:text-8xl!">The</h2>
    {#key index}
      <h1 in:fly={{y: 30, duration: 1000, delay: 300}} out:blur={{duration: 500, amount: 10}}>
        {words[index]}
      </h1>
    {/key}
  </div>
  <h2>Way to <span class="pretty-style">Do it Altogether.</span></h2>
</div>

<style lang="postcss">
  h1 {
    @apply pretty-style absolute ml-[120px] text-6xl max-sm:ml-[70px] max-sm:mt-1 max-sm:text-4xl md:-mt-1 md:ml-[185px] md:text-8xl;
  }

  h2 {
    @apply mt-2 bg-none text-4xl text-neutral-300 max-sm:text-2xl md:text-5xl;
  }
</style>
