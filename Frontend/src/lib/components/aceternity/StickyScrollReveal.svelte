<script lang="ts">
  import {onMount} from 'svelte';

  let activeCard = 0;
  let scrollYProgress = 0;
  let ref: HTMLDivElement;

  export let content: {title: string; description: string; images: string[]}[];

  onMount(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      scrollYProgress = target.scrollTop / target.scrollHeight;
      const cardsBreakpoints = content.map((_, index) => index / content.length);

      cardsBreakpoints.forEach((breakpoint, index) => {
        if (scrollYProgress + 0.1 > breakpoint && scrollYProgress <= breakpoint) {
          activeCard = index;
        }
      });
    };

    ref.addEventListener('scroll', handleScroll);
    return () => ref.removeEventListener('scroll', handleScroll);
  });
</script>

<div bind:this={ref} id="main">
  <div class="max-w-2xl">
    {#each content as item, index (index)}
      <slot name="text" item={{...item, activeCard, index}} />
    {/each}
  </div>
  <slot name="image" item={content[activeCard]} />
</div>

<style lang="postcss">
  #main {
    @apply relative flex h-full w-full justify-center gap-x-24 overflow-y-auto;
  }
</style>
