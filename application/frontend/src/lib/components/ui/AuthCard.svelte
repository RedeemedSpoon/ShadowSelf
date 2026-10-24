<script lang="ts">
  import {MediaQuery} from 'svelte/reactivity';
  import type {Snippet} from 'svelte';

  let {stage, children}: {stage: string | number; children: Snippet} = $props();
  let panel: HTMLElement;
  let previousStage: string | number | undefined;
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

  $effect(() => {
    const nextStage = stage;
    const initial = previousStage === undefined;
    const unchanged = previousStage === nextStage;

    previousStage = nextStage;

    if (initial || unchanged || nextStage === 'complete' || reducedMotion.current) {
      return;
    }

    const animation = panel.animate(
      [
        {opacity: 0, transform: 'translateX(-20px)'},
        {opacity: 1, transform: 'translateX(0)'},
      ],
      {duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)'},
    );

    return () => animation.cancel();
  });
</script>

<section class="panel" bind:this={panel}>
  {@render children()}
</section>
