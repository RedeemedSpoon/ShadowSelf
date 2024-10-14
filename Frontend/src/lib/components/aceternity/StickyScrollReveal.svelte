<script lang="ts">
  import {onMount} from 'svelte';

  let activeCard = 0;
  let backgroundColors = ['var(--slate-900)', 'var(--black)', 'var(--neutral-900)'];
  let linearGradients = [
    'linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))',
    'linear-gradient(to bottom right, var(--pink-500), var(--indigo-500))',
    'linear-gradient(to bottom right, var(--orange-500), var(--yellow-500))',
  ];
  let scrollYProgress = 0;

  export let content: {title: string; description: string}[] = [
    {title: 'Title 1', description: 'Description 1'},
    {title: 'Title 2', description: 'Description 2'},
    {title: 'Title 3', description: 'Description 2'},
  ];

  let ref: HTMLDivElement;

  onMount(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      scrollYProgress = target.scrollTop / target.scrollHeight;
      const cardsBreakpoints = content.map((_, index) => index / content.length);

      cardsBreakpoints.forEach((breakpoint, index) => {
        if (scrollYProgress > breakpoint - 0.2 && scrollYProgress <= breakpoint) {
          activeCard = index;
        }
      });
    };

    ref.addEventListener('scroll', handleScroll);

    return () => {
      ref.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<div
  bind:this={ref}
  style="background-color: {backgroundColors[activeCard % backgroundColors.length]}"
  class="relative flex h-[30rem] justify-center space-x-10 overflow-y-auto rounded-md p-10 transition ease-in-out">
  <div class="div relative flex items-start px-4">
    <div class="max-w-2xl">
      {#each content as item, index (item.title + index)}
        <div class="my-20">
          <h2 style="opacity: {activeCard === index ? 1 : 0.3}" class="text-2xl font-bold text-slate-100">
            {item.title}
          </h2>
          <p style="opacity: {activeCard === index ? 1 : 0.3}" class="text-kg mt-10 max-w-sm text-slate-300">
            {item.description}
          </p>
        </div>
      {/each}
      <div class="h-40" />
    </div>
  </div>
  <div
    style="background: {linearGradients[activeCard % linearGradients.length]}"
    class="sticky top-10 hidden h-60 w-80 overflow-hidden rounded-md bg-white lg:block">
  </div>
</div>
