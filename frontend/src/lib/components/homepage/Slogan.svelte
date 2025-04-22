<script lang="ts">
  import {background} from '$image';
  import {onMount} from 'svelte';

  onMount(() => {
    setTimeout(() => {
      const underlineText = document.querySelector('#underline-text');
      underlineText?.classList.add('max-w-full!');
    }, 1250);
    setTimeout(() => {
      const highlight = document.querySelector('#highlight') as HTMLDivElement;
      const highlightedText = document.querySelector('#highlighted-text');

      highlightedText?.classList.add('text-neutral-300!');
      highlight?.classList.add('max-w-full!');
    }, 2000);
  });
</script>

<div id="background" style="background-image: url({background})"></div>
<div class="-mb-2 mt-[5vh] flex max-sm:-mb-4 max-sm:scale-90">
  <h2 class="mr-5">Your</h2>
  <h2>Privacy<span id="underline-text"></span></h2>
  <h2>,</h2>
</div>

<div class="flex max-sm:scale-75">
  <h1 class="mr-6">Our</h1>
  <h1 id="highlighted-text">
    <span>Priority</span>
    <div id="highlight"></div>
  </h1>
  <h1 class="ml-2">.</h1>
</div>

<style lang="postcss">
  @reference "$style";

  #background {
    @apply animate-scroll absolute inset-0 -z-10 h-full min-h-[50rem] w-full bg-cover bg-center bg-repeat-x;
  }

  #underline-text {
    @apply basic-style mt-1 block h-1 max-w-0 transition-all duration-500 ease-in-out;
  }

  #highlight {
    @apply basic-style absolute inset-0 top-2 -z-10 max-w-0 transition-all duration-1000 ease-in-out;
  }

  #highlighted-text {
    @apply relative p-2 transition-all duration-1000 ease-in-out;
  }

  h1 {
    @apply basic-style text-7xl font-semibold sm:text-8xl md:text-9xl;
  }

  h2 {
    @apply text-5xl text-neutral-300 sm:text-6xl md:text-7xl;
  }
</style>
