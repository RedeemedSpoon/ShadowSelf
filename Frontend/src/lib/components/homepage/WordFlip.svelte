<script lang="ts">
  import {blur, fly} from 'svelte/transition';

  let index = 0;
  const words = ['Simple', 'Affordable', 'Secure', 'Reliable', 'Open', 'Fast', 'Private', 'Easy', 'Best'];

  setInterval(() => (index = (index + 1) % words.length), 3500);
</script>

<div>
  <div class="flex">
    <h1>The</h1>
    {#key index}
      <h1 id="word" in:fly={{y: 30, duration: 1000, delay: 250}} out:blur={{duration: 500, amount: 10}}>
        {words[index]}
      </h1>
    {/key}
  </div>
  <h1>Way to Do it All.</h1>
</div>

<style lang="postcss">
  #word {
    @apply absolute ml-[150px] font-extrabold;
  }
</style>
