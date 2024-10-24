<script lang="ts">
  import {onMount} from 'svelte';
  import {scrollYProgress} from '$store';

  let activeCard = 0;
  let ref: HTMLDivElement;

  export let content: {title: string; description: string; images: string[]}[];
  const cardsBreakpoints = content.map((_, index) => index / content.length);
  const gradient = ['purple', 'orange', 'blue', 'green', 'red'];

  onMount(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      $scrollYProgress = target.scrollTop / target.scrollHeight;
      cardsBreakpoints.forEach((breakpoint, index) => {
        if ($scrollYProgress + 0.1 > breakpoint && $scrollYProgress <= breakpoint) {
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
  <div id="wrapper" class={gradient[activeCard]}>
    {#key activeCard}
      <slot name="image" item={content[activeCard]} />
    {/key}
  </div>
</div>

<style lang="postcss">
  #main {
    @apply no-scrollbar relative flex h-full w-full snap-y snap-mandatory justify-center gap-x-24 overflow-y-auto;
  }

  #wrapper {
    @apply sticky top-32 h-2/3 w-1/3 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 p-[5px];
  }

  #wrapper::before {
    @apply animate-border absolute left-[-25%] top-[-25%] h-[150%] w-[150%] content-[''];
  }

  .purple::before {
    background: conic-gradient(rgb(79, 70, 229) 0deg, rgb(67, 56, 202) 0deg, transparent 80deg);
  }

  .red::before {
    background: conic-gradient(rgb(220, 38, 38) 0deg, rgb(185, 28, 28) 0deg, transparent 80deg);
  }

  .green::before {
    background: conic-gradient(rgb(22, 163, 74) 0deg, rgb(21, 128, 61) 0deg, transparent 80deg);
  }

  .orange::before {
    background: conic-gradient(rgb(234, 88, 12) 0deg, rgb(194, 65, 12) 0deg, transparent 80deg);
  }

  .blue::before {
    background: conic-gradient(rgb(37, 99, 235) 0deg, rgb(29, 78, 216) 0deg, transparent 80deg);
  }
</style>
