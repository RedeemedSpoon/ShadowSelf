<script lang="ts">
  import {blur, fly} from 'svelte/transition';

  let index = 0;
  const words = ['Simple', 'Affordable', 'Secure', 'Reliable', 'Fast', 'Private'];
  const colors = ['sky', 'red', 'green', 'yellow', 'fuchsia', 'orange'];

  setInterval(() => (index = (index + 1) % words.length), 3500);
</script>

<div>
  <div class="flex">
    <h1>The</h1>
    {#key index}
      <h1
        class={colors[index]}
        id="word"
        in:fly={{y: 30, duration: 1000, delay: 250}}
        out:blur={{duration: 500, amount: 10}}>
        {words[index]}
      </h1>
    {/key}
  </div>
  <h1>Way to Do it All.</h1>
</div>

<style lang="postcss">
  #word {
    @apply absolute ml-[150px] bg-gradient-to-br font-extrabold;
  }

  .sky {
    @apply from-sky-600 to-sky-700;
  }

  .red {
    @apply from-red-700 to-red-800;
  }

  .green {
    @apply from-green-600 to-green-700;
  }

  .yellow {
    @apply from-yellow-600 to-yellow-700;
  }

  .fuchsia {
    @apply from-fuchsia-600 to-fuchsia-700;
  }

  .orange {
    @apply from-orange-700 to-orange-800;
  }
</style>
