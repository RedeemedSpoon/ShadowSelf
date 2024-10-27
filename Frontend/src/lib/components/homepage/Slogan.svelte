<script lang="ts">
  import {onMount} from 'svelte';

  onMount(() => {
    setTimeout(() => {
      const underlineText = document.querySelector('#underline-text');
      underlineText?.classList.add('!max-w-full');
    }, 1250);

    setTimeout(() => {
      const highlight = document.querySelector('#highlight') as HTMLDivElement;
      const highlightedText = document.querySelector('#highlighted-text');
      const rect = highlightedText?.getBoundingClientRect();

      highlight?.style.setProperty('height', `${rect?.height}px`);
      highlight?.style.setProperty('width', `${rect?.width}px`);

      highlightedText?.classList.add('!text-neutral-300');
      highlight?.classList.add('!max-w-full');
    }, 2000);
  });
</script>

<div class="-mb-2 mt-32 flex">
  <h1 class="mr-5 text-neutral-300">Your</h1>
  <h1 class="text-neutral-300">Privacy<span id="underline-text"></span></h1>
  <h1 class="text-neutral-300">,</h1>
</div>
<div class="flex">
  <h1 class="mr-6 text-9xl">Our</h1>
  <h1 id="highlighted-text">Priority</h1>
  <h1 class="ml-2 text-9xl">.</h1>
  <div id="highlight"></div>
</div>

<style lang="postcss">
  #underline-text {
    @apply from-primary-600 to-primary-800 mt-1 block h-1 max-w-0 bg-gradient-to-br transition-all duration-500;
  }

  #highlight {
    @apply from-primary-600 to-primary-800 absolute ml-64 max-w-0 bg-gradient-to-br transition-all duration-1000 ease-in-out;
  }

  #highlighted-text {
    @apply px-2 text-9xl transition-all duration-1000 ease-in-out;
  }

  h1 {
    @apply from-primary-600 to-primary-800 bg-gradient-to-br font-semibold;
  }
</style>
