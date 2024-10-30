<script lang="ts">
  import {scrollYProgress} from '$store';
  import {Card} from '$components';
  import {onMount} from 'svelte';

  let activeCard = 0;
  let direction = 'down';
  let ref: HTMLDivElement;

  export let content: {title: string; description: string; images: string[]}[];
  const cardsBreakpoints = content.map((_, index) => index / content.length);
  const gradient = ['purple', 'red', 'blue', 'green', 'orange'];

  onMount(() => {
    const handleScroll = (e: Event) => {
      if ($scrollYProgress >= 0.79 && direction === 'down') window.scrollBy(0, 150);
      const target = e.target as HTMLDivElement;
      $scrollYProgress = target.scrollTop / target.scrollHeight;

      cardsBreakpoints.forEach((breakpoint, index) => {
        if ($scrollYProgress + 0.1 > breakpoint && $scrollYProgress <= breakpoint) {
          activeCard = index;
        }
      });
    };

    ref.addEventListener('scroll', handleScroll);
    ref.addEventListener('wheel', (e) => (direction = e.deltaY > 0 ? 'down' : 'up'));
    return () => ref.removeEventListener('scroll', handleScroll);
  });
</script>

<div bind:this={ref} id="main" class:overflow-y-hidden={direction === 'down' && $scrollYProgress >= 0.79}>
  <div class="max-w-2xl">
    {#each content as item, index (index)}
      <slot name="text" item={{...item, activeCard, index}} />
    {/each}
  </div>
  <Card upperClass={'w-1/3 h-2/3 top-32 sticky'} color={gradient[activeCard]}>
    <div id="wrapper" class={gradient[activeCard]}>
      {#key activeCard}
        <slot name="image" item={content[activeCard]} />
      {/key}
    </div>
  </Card>
</div>

<style lang="postcss">
  #main {
    @apply no-scrollbar relative flex h-full w-full snap-y snap-mandatory justify-center gap-x-24 overflow-y-auto;
  }

  #wrapper {
    @apply relative h-full w-full overflow-hidden rounded-2xl p-[5px];
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
