<script lang="ts">
  import {toTitleCase} from '$utils/formating';
  import {blur, fly} from 'svelte/transition';

  let index = $state(0);
  const words = ['effective', 'simple', 'affordable', 'secure', 'superior', 'reliable', 'trusted', 'private', 'fast'];

  setInterval(() => (index = (index + 1) % words.length), 3000);
</script>

<div>
  <h6 class="text-lg text-neutral-500 max-sm:text-sm">Powered by You, and the Community.</h6>
  <div class="relative flex">
    <h2 class="text-6xl! max-sm:text-4xl! md:text-8xl!">The</h2>
    {#key index}
      <h1 in:fly={{y: 30, duration: 1000, delay: 300}} out:blur={{duration: 500, amount: 10}}>
        {toTitleCase(words[index])}
      </h1>
    {/key}
  </div>
  <h2>Way to <span class="pretty-style">Do it Altogether.</span></h2>
</div>

<style lang="postcss">
  @reference "$style";

  h1 {
    @apply pretty-style absolute ml-31.25 text-6xl max-sm:mt-1 max-sm:ml-17.5 max-sm:text-4xl md:mt-2 md:ml-47.5 md:text-8xl;
  }

  h2 {
    @apply mt-2 bg-none text-4xl text-neutral-300 max-sm:text-2xl md:text-5xl;
  }
</style>
